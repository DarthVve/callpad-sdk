import type { Participant } from "livekit-client";
import type { ParticipantMetadata } from "../state/types";

export function useParticipantMetadata(
  participant: Participant
): ParticipantMetadata | null {
  try {
    const metadata = participant.metadata ? JSON.parse(participant.metadata) as ParticipantMetadata : {} as ParticipantMetadata;

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
