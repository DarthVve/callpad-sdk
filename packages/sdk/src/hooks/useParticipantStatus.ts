import { useEffect, useState } from "react";
import { SdkEventType, eventBus } from "../core/events";
import { useRtcStore } from "../state/store";
import type { Participant } from "../state/types";

/**
 * Enhanced participant status interface following spec requirements
 */
export interface ParticipantStatus {
  connectionState: "connecting" | "connected" | "reconnecting" | "disconnected";
  mediaState: {
    audio: "enabled" | "disabled" | "muted";
    video: "enabled" | "disabled" | "camera_off";
  };
  networkQuality: "excellent" | "good" | "poor" | "lost" | "unknown";
  lastSeen?: number;
  speaking?: boolean;
}

/**
 * Hook for tracking real-time participant status
 */
export function useParticipantStatus(participantId: string): ParticipantStatus {
  const participant = useRtcStore(
    (state) => state.room.participants[participantId]
  );
  const connection = useRtcStore((state) => state.connection);

  const [status, setStatus] = useState<ParticipantStatus>(() =>
    getInitialStatus(participant || null, connection.connected)
  );

  // Update status when participant data changes
  useEffect(() => {
    if (!participant) {
      setStatus(getDisconnectedStatus());
      return;
    }

    setStatus((prevStatus) => ({
      ...prevStatus,
      connectionState: getConnectionState(participant, connection.connected),
      mediaState: {
        audio: getAudioState(participant),
        video: getVideoState(participant),
      },
      networkQuality: participant.connectionQuality || "unknown",
      lastSeen: participant.joinedAt || Date.now(),
      speaking: participant.isSpeaking || false,
    }));
  }, [participant, connection.connected]);

  // Listen for real-time media events
  useEffect(() => {
    const mediaEnabledSub = eventBus.on(SdkEventType.MEDIA_ENABLED, (event) => {
      if (event.payload.participantId === participantId) {
        setStatus((prevStatus) => ({
          ...prevStatus,
          mediaState: {
            ...prevStatus.mediaState,
            [event.payload.mediaType]: "enabled",
          },
        }));
      }
    });

    const mediaDisabledSub = eventBus.on(
      SdkEventType.MEDIA_DISABLED,
      (event) => {
        if (event.payload.participantId === participantId) {
          setStatus((prevStatus) => ({
            ...prevStatus,
            mediaState: {
              ...prevStatus.mediaState,
              [event.payload.mediaType]: "disabled",
            },
          }));
        }
      }
    );

    const connectionQualitySub = eventBus.on(
      SdkEventType.CONNECTION_QUALITY_CHANGED,
      (event) => {
        if (event.payload.participantId === participantId) {
          setStatus((prevStatus) => ({
            ...prevStatus,
            networkQuality: event.payload.quality,
          }));
        }
      }
    );


    return () => {
      mediaEnabledSub.unsubscribe();
      mediaDisabledSub.unsubscribe();
      connectionQualitySub.unsubscribe();
    };
  }, [participantId]);

  return status;
}

/**
 * Hook for tracking multiple participants' status
 */
export function useParticipantsStatus(
  participantIds: string[]
): Record<string, ParticipantStatus> {
  const [statuses, setStatuses] = useState<Record<string, ParticipantStatus>>(
    {}
  );

  useEffect(() => {
    const updateStatus = (id: string, status: ParticipantStatus) => {
      setStatuses((prev) => ({
        ...prev,
        [id]: status,
      }));
    };

    // Initialize statuses
    const initialStatuses: Record<string, ParticipantStatus> = {};
    for (const id of participantIds) {
      initialStatuses[id] = getInitialStatus(null, false);
    }
    setStatuses(initialStatuses);

    // Set up event listeners for all participants
    const subscriptions = [
      eventBus.onPattern("*", (event) => {
        const participantId =
          event.payload?.participantId || event.payload?.participant?.id;
        if (participantId && participantIds.includes(participantId)) {
          // Update the specific participant's status
          setStatuses((prev) => {
            const currentStatus =
              prev[participantId] || getInitialStatus(null, false);
            return {
              ...prev,
              [participantId]: updateStatusFromEvent(currentStatus, event),
            };
          });
        }
      }),
    ];

    return () => {
      for (const sub of subscriptions) {
        sub.unsubscribe();
      }
    };
  }, [participantIds]);

  return statuses;
}

/**
 * Hook for getting all participants with their real-time status
 */
export function useParticipantsWithStatus(): (Participant & {
  status: ParticipantStatus;
})[] {
  const participants = useRtcStore((state) =>
    Object.values(state.room.participants)
  );
  const connection = useRtcStore((state) => state.connection);

  return participants.map((participant) => ({
    ...participant,
    status: {
      connectionState: getConnectionState(participant, connection.connected),
      mediaState: {
        audio: getAudioState(participant),
        video: getVideoState(participant),
      },
      networkQuality: participant.connectionQuality || "unknown",
      lastSeen: participant.joinedAt || Date.now(),
      speaking: participant.isSpeaking || false,
    },
  }));
}

function getInitialStatus(
  participant: Participant | null,
  isConnected: boolean
): ParticipantStatus {
  if (!participant) {
    return getDisconnectedStatus();
  }

  return {
    connectionState: getConnectionState(participant, isConnected),
    mediaState: {
      audio: getAudioState(participant),
      video: getVideoState(participant),
    },
    networkQuality: participant.connectionQuality || "unknown",
    lastSeen: participant.joinedAt || Date.now(),
    speaking: participant.isSpeaking || false,
  };
}

function getDisconnectedStatus(): ParticipantStatus {
  return {
    connectionState: "disconnected",
    mediaState: {
      audio: "disabled",
      video: "disabled",
    },
    networkQuality: "unknown",
    speaking: false,
  };
}

function getConnectionState(
  participant: Participant,
  isGloballyConnected: boolean
): ParticipantStatus["connectionState"] {
  if (!isGloballyConnected) {
    return "disconnected";
  }

  // In the new architecture, if a participant exists in the store
  // and we're globally connected, they are connected via LiveKit
  return "connected";
}

function getAudioState(
  participant: Participant
): ParticipantStatus["mediaState"]["audio"] {
  if (!participant.audioEnabled) {
    return "disabled";
  }
  // Could add muted state detection here based on additional data
  return "enabled";
}

function getVideoState(
  participant: Participant
): ParticipantStatus["mediaState"]["video"] {
  if (!participant.videoEnabled) {
    return "camera_off";
  }
  return "enabled";
}

function updateStatusFromEvent(
  currentStatus: ParticipantStatus,
  event: any
): ParticipantStatus {
  const newStatus = { ...currentStatus };

  switch (event.type) {
    case SdkEventType.MEDIA_ENABLED:
      newStatus.mediaState = {
        ...newStatus.mediaState,
        [event.payload.mediaType]: "enabled",
      };
      break;
    case SdkEventType.MEDIA_DISABLED:
      newStatus.mediaState = {
        ...newStatus.mediaState,
        [event.payload.mediaType]:
          event.payload.mediaType === "video" ? "camera_off" : "disabled",
      };
      break;
    case SdkEventType.CONNECTION_QUALITY_CHANGED:
      newStatus.networkQuality = event.payload.quality;
      break;
  }

  return newStatus;
}
