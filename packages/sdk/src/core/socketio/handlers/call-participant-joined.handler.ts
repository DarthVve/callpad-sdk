import { BaseSocketHandler } from "./base.handler";
import { callParticipantJoinedSchema } from "./schema";
import type { CallParticipantJoinedEvent } from "./schema";

export class CallParticipantJoinedHandler extends BaseSocketHandler<CallParticipantJoinedEvent> {
  protected readonly eventName = "call.participant-joined";
  protected readonly schema = callParticipantJoinedSchema;

  protected handle(data: CallParticipantJoinedEvent): void {
    this.updateStore((state) => {
      const participant = state.room.participants[data.participant.id];
      if (participant) {
        participant.callState = "JOINED";
        participant.joinedAt = data.timestamp || Date.now();
        
        this.logger.debug("Participant state updated via socket event", {
          participantId: data.participant.id,
          callState: "JOINED",
          callId: data.callId,
          source: "call.participant-joined",
        });
      } else {
        this.logger.warn("Participant not found for join event", {
          participantId: data.participant.id,
          callId: data.callId,
          availableParticipants: Object.keys(state.room.participants),
        });
      }
    });
  }
}
