import {useParticipants, type UseParticipantsOptions} from "@livekit/components-react";
import { useRoom } from "../hooks";

export function useParticipantCount(options?: UseParticipantsOptions): number {
  const room = useRoom();
  if (!room) {
    return 0;
  }

  const participants = useParticipants(options);
  return participants.length;
}
