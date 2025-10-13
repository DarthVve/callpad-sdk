import { useParticipantInfo as useLiveKitParticipantInfo, useParticipants } from "@livekit/components-react";
import type { ParticipantMetadata } from "../state/types";

export function useParticipantMetadata(
  participantId?: string
): ParticipantMetadata | null {
  const participants = useParticipants();

  const resolvedParticipant = participants.find((p) => p.identity === participantId)
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
