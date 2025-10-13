import { useParticipantInfo as useLiveKitParticipantInfo, useParticipants } from "@livekit/components-react";
import type { Participant as LiveKitParticipant } from "livekit-client";
import { useRoom } from "./useRoom";
import type { ParticipantMetadata } from "../state/types";

export function useParticipantMetadata(
  participantOrIdentity?: string | LiveKitParticipant
): ParticipantMetadata | null {
  const room = useRoom();
  const participants = useParticipants(room ? { room } : {});
  let resolvedParticipant: LiveKitParticipant | undefined;

  if (typeof participantOrIdentity === "string") {
    resolvedParticipant = participants.find(
      (p) => p.identity === participantOrIdentity
    );
  } else if (participantOrIdentity) {
    resolvedParticipant = participantOrIdentity;
  }

  const livekitInfo = useLiveKitParticipantInfo(
    resolvedParticipant ? { participant: resolvedParticipant } : {}
  );

  if (!livekitInfo.metadata) {
    return null;
  }

  try {
    const metadata = JSON.parse(livekitInfo.metadata) as ParticipantMetadata;
    if (!metadata.userId || !metadata.role) {
      console.warn("Invalid participant metadata: missing required fields", metadata);
      return null;
    }

    return {
      userId: metadata.userId,
      role: metadata.role,
      firstName: metadata.firstName || "",
      lastName: metadata.lastName || "",
      username: metadata.username || "",
      email: metadata.email || "",
      profilePhoto: metadata.profilePhoto || "",
    };
  } catch (error) {
    console.error("Failed to parse participant metadata:", error);
    return null;
  }
}
