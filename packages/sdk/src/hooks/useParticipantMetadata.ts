import { useParticipantInfo } from "@livekit/components-react";
import type { LocalParticipant, RemoteParticipant } from "livekit-client";
import type { ParticipantMetadata } from "../state/types";

export function useParticipantMetadata(
  participant: RemoteParticipant | LocalParticipant | null | undefined
): ParticipantMetadata | null {
  // Don't use LiveKit hook for null participants - just access metadata directly
  if (!participant || !participant.metadata) {
    return null;
  }

  try {
    return participant.metadata
      ? (JSON.parse(participant.metadata) as ParticipantMetadata)
      : ({} as ParticipantMetadata);
  } catch (error) {
    console.error("Failed to parse participant metadata:", error);
    return null;
  }
}
