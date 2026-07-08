import {
  type UseParticipantsOptions,
  useParticipants,
} from "@livekit/components-react";

export function useParticipantCount(options?: UseParticipantsOptions): number {
  const participants = useParticipants(options);
  return participants.length;
}
