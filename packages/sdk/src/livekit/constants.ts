import type {
  ConnectionQuality,
  ReconnectPolicy,
  RoomOptions,
} from "livekit-client";
import { VideoPresets } from "livekit-client";

/**
 * Production-ready room options with optimal settings
 */
export const DEFAULT_ROOM_OPTIONS: RoomOptions = {
  // Performance optimizations
  adaptiveStream: true,
  dynacast: true,

  // Browser lifecycle handling
  disconnectOnPageLeave: true,

  // Reconnection handling with exponential backoff
  reconnectPolicy: {
    nextRetryDelayInMs: (context) => {
      // Exponential backoff with jitter: base delay * 2^retryCount + random jitter
      const baseDelay = 1000;
      const maxDelay = 30000;
      const delay = Math.min(baseDelay * 2 ** context.retryCount, maxDelay);
      const jitter = Math.random() * 1000; // Add up to 1s jitter
      return delay + jitter;
    },
  },

  // Media capture defaults
  videoCaptureDefaults: {
    facingMode: "user",
    resolution: VideoPresets.h720.resolution,
  },
  publishDefaults: {
    videoSimulcastLayers: [
      VideoPresets.h180,
      VideoPresets.h360,
      VideoPresets.h720,
    ],
    // stopLocalTrackOnUnpublish: true, // Not available in current LiveKit version
  },
  audioCaptureDefaults: {
    // Force enable core audio processing with exact constraints
    echoCancellation: { exact: true },
    noiseSuppression: { exact: true },
    autoGainControl: { exact: true },

    // Optimal settings for call quality
    sampleRate: { ideal: 48000 }, // Best for echo cancellation
    channelCount: { exact: 1 }, // Mono reduces echo issues
    latency: { ideal: 0.01 }, // Low latency improves echo handling
  },

  // Audio handling
  webAudioMix: true,
};

export const TRACK_ATTACHMENT_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
} as const;

/**
 * Connection quality thresholds for network monitoring
 */
export const CONNECTION_QUALITY_THRESHOLDS = {
  excellent: { minScore: 5, label: "excellent" },
  good: { minScore: 3, label: "good" },
  poor: { minScore: 1, label: "poor" },
  lost: { minScore: 0, label: "lost" },
} as const;

/**
 * Screen share configuration
 */
export const SCREEN_SHARE_CONFIG = {
  video: true,
  audio: true,
} as const;
