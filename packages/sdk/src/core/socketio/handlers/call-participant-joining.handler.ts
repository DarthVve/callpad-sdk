import { BaseSocketHandler } from "./base.handler";
import { callParticipantJoiningSchema } from "./schema";
import type { CallParticipantJoiningEvent } from "./schema";

export class CallParticipantJoiningHandler extends BaseSocketHandler<CallParticipantJoiningEvent> {
  protected readonly eventName = "call.participant-joining";
  protected readonly schema = callParticipantJoiningSchema;

  protected handle(data: CallParticipantJoiningEvent): void {
    this.updateStore((state) => {
      const participant = state.room.participants[data.participant.id];
      if (participant) {
        participant.callState = "RINGING"; // Participant is getting ready to join
        participant.joinedAt = data.timestamp || Date.now();
        
        this.logger.debug("Participant state updated via socket event", {
          participantId: data.participant.id,
          callState: "RINGING",
          callId: data.callId,
          source: "call.participant-joining",
        });
      } else {
        this.logger.warn("Participant not found for joining event", {
          participantId: data.participant.id,
          callId: data.callId,
          availableParticipants: Object.keys(state.room.participants),
        });
      }
    });
  }
}
