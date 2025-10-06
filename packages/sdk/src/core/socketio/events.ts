import type {
  CallAcceptedEvent,
  CallEndedEvent,
  CallIncomingEvent,
  CallJoinInfoEvent,
  ParticipantLeftEvent,
} from "./schema";

// Socket events map for type safety using zod schemas
export type SocketEvents = {
  "call.incoming": CallIncomingEvent;
  "call.accepted": CallAcceptedEvent;
  "call.declined": {
    callId: string;
    declinedBy: string;
    reason?: string;
    timestamp: number;
  };
  "call.ended": CallEndedEvent;
  "call.join-info": CallJoinInfoEvent;
  "call.participant-left": ParticipantLeftEvent;
};
