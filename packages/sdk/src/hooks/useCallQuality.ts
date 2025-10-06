import { useEffect, useRef, useState } from "react";
import { useSdk } from "../provider/RtcProvider";
import { useRtcStore } from "../state/store";
import { createLogger } from "../utils/logger";

const logger = createLogger("hooks:call-quality");

/**
 * Call quality metrics interface following spec requirements
 */
export interface CallQuality {
  overall: "excellent" | "good" | "poor" | "failed";
  metrics: {
    latency: number; // ms
    packetLoss: number; // percentage
    bandwidth: {
      upload: number; // kbps
      download: number; // kbps
    };
    resolution?: {
      width: number;
      height: number;
    };
  };
  timestamp: number;
}

/**
 * Hook for monitoring call quality metrics
 */
export function useCallQuality(): {
  quality: CallQuality | null;
  history: CallQuality[];
} {
  const sdk = useSdk();
  const isConnected = useRtcStore((state) => state.connection.connected);
  const [quality, setQuality] = useState<CallQuality | null>(null);
  const [history, setHistory] = useState<CallQuality[]>([]);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isConnected || !sdk.livekit?.room) {
      // Clear quality when disconnected
      setQuality(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = null;
      return;
    }

    // Start quality monitoring
    const startMonitoring = async () => {
      try {
        await collectQualityMetrics();

        // Set up periodic collection every 5 seconds
        intervalRef.current = setInterval(collectQualityMetrics, 5000);
      } catch (error) {
        logger.error("Failed to start quality monitoring", { error });
      }
    };

    const collectQualityMetrics = async () => {
      try {
        const newQuality = await getCallQualityMetrics();
        if (newQuality) {
          setQuality(newQuality);
          setHistory((prev) => {
            const updated = [...prev, newQuality];
            // Keep only last 50 entries (about 4 minutes of history)
            return updated.slice(-50);
          });
        }
      } catch (error) {
        logger.error("Failed to collect quality metrics", { error });
      }
    };

    startMonitoring();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isConnected, sdk.livekit]);

  const getCallQualityMetrics = async (): Promise<CallQuality | null> => {
    const room = sdk.livekit?.room;
    if (!room || !room.localParticipant) {
      return null;
    }

    try {
      // Get WebRTC stats
      const stats = await getWebRTCStats(room);
      if (!stats) {
        return null;
      }

      // Calculate overall quality based on metrics
      const overall = calculateOverallQuality(stats);

      return {
        overall,
        metrics: {
          latency: stats.latency,
          packetLoss: stats.packetLoss,
          bandwidth: {
            upload: stats.bandwidth.upload,
            download: stats.bandwidth.download,
          },
          ...(stats.resolution ? { resolution: stats.resolution } : {}),
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error("Error getting quality metrics", { error });
      return null;
    }
  };

  return { quality, history };
}

/**
 * Hook for monitoring call quality with custom intervals
 */
export function useCallQualityWithConfig(
  intervalMs = 5000,
  maxHistorySize = 50
): {
  quality: CallQuality | null;
  history: CallQuality[];
} {
  const sdk = useSdk();
  const isConnected = useRtcStore((state) => state.connection.connected);
  const [quality, setQuality] = useState<CallQuality | null>(null);
  const [history, setHistory] = useState<CallQuality[]>([]);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isConnected || !sdk.livekit?.room) {
      setQuality(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = null;
      return;
    }

    const collectMetrics = async () => {
      const room = sdk.livekit?.room;
      if (!room) return;

      try {
        const stats = await getWebRTCStats(room);
        if (!stats) return;

        const newQuality: CallQuality = {
          overall: calculateOverallQuality(stats),
          metrics: {
            latency: stats.latency,
            packetLoss: stats.packetLoss,
            bandwidth: {
              upload: stats.bandwidth.upload,
              download: stats.bandwidth.download,
            },
            ...(stats.resolution ? { resolution: stats.resolution } : {}),
          },
          timestamp: Date.now(),
        };

        setQuality(newQuality);
        setHistory((prev) => {
          const updated = [...prev, newQuality];
          return updated.slice(-maxHistorySize);
        });
      } catch (error) {
        logger.error("Failed to collect quality metrics", { error });
      }
    };

    // Initial collection
    collectMetrics();

    // Set up interval
    intervalRef.current = setInterval(collectMetrics, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isConnected, sdk.livekit, intervalMs, maxHistorySize]);

  return { quality, history };
}

/**
 * Hook for getting quality metrics for a specific participant
 */
export function useParticipantQuality(
  participantId?: string
): CallQuality | null {
  const sdk = useSdk();
  const isConnected = useRtcStore((state) => state.connection.connected);
  const [quality, setQuality] = useState<CallQuality | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isConnected || !sdk.livekit?.room) {
      setQuality(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = null;
      return;
    }

    const room = sdk.livekit.room;
    const participant = participantId
      ? room.remoteParticipants.get(participantId) || room.localParticipant
      : room.localParticipant;

    if (!participant) {
      setQuality(null);
      return;
    }

    const collectParticipantMetrics = async () => {
      try {
        const stats = await getParticipantStats(room, participant);
        if (stats) {
          const newQuality: CallQuality = {
            overall: calculateOverallQuality(stats),
            metrics: {
              latency: stats.latency,
              packetLoss: stats.packetLoss,
              bandwidth: {
                upload: stats.bandwidth.upload,
                download: stats.bandwidth.download,
              },
              ...(stats.resolution ? { resolution: stats.resolution } : {}),
            },
            timestamp: Date.now(),
          };
          setQuality(newQuality);
        }
      } catch (error) {
        logger.error("Failed to collect participant quality metrics", {
          error,
          participantId,
        });
      }
    };

    // Initial collection
    collectParticipantMetrics();

    // Set up interval
    intervalRef.current = setInterval(collectParticipantMetrics, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isConnected, sdk.livekit, participantId]);

  return quality;
}

// Helper functions
interface WebRTCStats {
  latency: number;
  packetLoss: number;
  bandwidth: {
    upload: number;
    download: number;
  };
  resolution?: {
    width: number;
    height: number;
  };
}

async function getWebRTCStats(room: any): Promise<WebRTCStats | null> {
  try {
    // Get the underlying WebRTC peer connection
    const pc = room.engine?.publisher?.pc || room.engine?.subscriber?.pc;
    if (!pc) {
      return null;
    }

    const stats = await pc.getStats();
    const statsArray = Array.from(stats.values());

    // Extract relevant metrics
    let latency = 0;
    let packetLoss = 0;
    let uploadBandwidth = 0;
    let downloadBandwidth = 0;
    let resolution: { width: number; height: number } | undefined;

    for (const stat of statsArray) {
      const s = stat as any;
      // RTT (Round Trip Time) for latency
      if (s.type === "candidate-pair" && s.state === "succeeded") {
        latency = s.currentRoundTripTime ? s.currentRoundTripTime * 1000 : 0;
      }

      // Packet loss from outbound RTP
      if (s.type === "outbound-rtp" && s.mediaType === "audio") {
        if (s.packetsLost && s.packetsSent) {
          packetLoss = (s.packetsLost / s.packetsSent) * 100;
        }

        // Upload bandwidth (estimate from bytes sent)
        if (s.bytesSent && s.timestamp) {
          uploadBandwidth = (s.bytesSent * 8) / 1000; // Convert to kbps
        }
      }

      // Download bandwidth from inbound RTP
      if (s.type === "inbound-rtp" && s.mediaType === "audio") {
        if (s.bytesReceived && s.timestamp) {
          downloadBandwidth = (s.bytesReceived * 8) / 1000; // Convert to kbps
        }
      }

      // Video resolution from outbound video
      if (s.type === "outbound-rtp" && s.mediaType === "video") {
        if (s.frameWidth && s.frameHeight) {
          resolution = {
            width: s.frameWidth,
            height: s.frameHeight,
          };
        }
      }
    }

    const result: WebRTCStats = {
      latency: Math.round(latency),
      packetLoss: Math.round(packetLoss * 100) / 100, // Round to 2 decimal places
      bandwidth: {
        upload: Math.round(uploadBandwidth),
        download: Math.round(downloadBandwidth),
      },
    };

    if (resolution) {
      result.resolution = resolution;
    }

    return result;
  } catch (error) {
    logger.error("Error getting WebRTC stats", { error });
    return null;
  }
}

async function getParticipantStats(
  room: any,
  participant: any
): Promise<WebRTCStats | null> {
  // For now, return the same stats as the room
  // In a more sophisticated implementation, this could get participant-specific stats
  return getWebRTCStats(room);
}

function calculateOverallQuality(stats: WebRTCStats): CallQuality["overall"] {
  let score = 100;

  // Deduct points for high latency
  if (stats.latency > 300) {
    score -= 40; // Very high latency
  } else if (stats.latency > 150) {
    score -= 20; // High latency
  } else if (stats.latency > 100) {
    score -= 10; // Moderate latency
  }

  // Deduct points for packet loss
  if (stats.packetLoss > 5) {
    score -= 30; // High packet loss
  } else if (stats.packetLoss > 2) {
    score -= 15; // Moderate packet loss
  } else if (stats.packetLoss > 1) {
    score -= 5; // Low packet loss
  }

  // Deduct points for low bandwidth
  const totalBandwidth = stats.bandwidth.upload + stats.bandwidth.download;
  if (totalBandwidth < 50) {
    score -= 25; // Very low bandwidth
  } else if (totalBandwidth < 100) {
    score -= 10; // Low bandwidth
  }

  // Determine overall quality
  if (score >= 80) {
    return "excellent";
  }
  if (score >= 60) {
    return "good";
  }
  if (score >= 30) {
    return "poor";
  }
  return "failed";
}
