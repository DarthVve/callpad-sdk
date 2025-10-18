import type {LocalParticipant, RemoteParticipant} from "livekit-client";
import {useParticipantMetadata} from "./useParticipantMetadata";
import type {Nullable} from "../utils/types";
import type {ParticipantPermissions} from "../state/types";

export function useParticipantPermissions(participant: RemoteParticipant | LocalParticipant): Nullable<ParticipantPermissions> {
    const meta = useParticipantMetadata(participant);
    return meta?.permissions || null;
}
