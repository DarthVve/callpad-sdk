import {
    useParticipantInfo,

} from "@livekit/components-react";
import type { ParticipantMetadata } from "../state/types";
import type {Participant} from "livekit-client";

export function useParticipantMetadata(
  participant: Participant
): ParticipantMetadata | null {
    const info = useParticipantInfo({ participant})

  try {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const metadata = JSON.parse(info.metadata!) as ParticipantMetadata;

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
