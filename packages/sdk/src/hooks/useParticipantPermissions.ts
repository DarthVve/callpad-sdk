import type { LocalParticipant, RemoteParticipant } from "livekit-client";
import type { ParticipantPermissions } from "../state/types";
import type { Nullable } from "../utils/types";
import { useParticipantMetadata } from "./useParticipantMetadata";

export function useParticipantPermissions(
  participant: RemoteParticipant | LocalParticipant
): Nullable<ParticipantPermissions> {
  const meta = useParticipantMetadata(participant);
  return meta?.permissions || null;
}
