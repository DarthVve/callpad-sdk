import { useParticipantInfo } from "@livekit/components-react";
import type { LocalParticipant, RemoteParticipant } from "livekit-client";
import type { ParticipantMetadata } from "../state/types";

export function useParticipantMetadata(
  participant: RemoteParticipant | LocalParticipant
): ParticipantMetadata | null {
  if (!participant.metadata) {
    return null;
  }

  const m = useParticipantInfo({ participant });
  const info = participant;

  try {
    return info.metadata
      ? (JSON.parse(info.metadata) as ParticipantMetadata)
      : ({} as ParticipantMetadata);
  } catch (error) {
    console.error("Failed to parse participant metadata:", error);
    return null;
  }
}
