import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";
import { callParticipantDeclinedSchema } from "./schema";
import type { CallParticipantDeclinedEvent } from "./schema";

export class CallParticipantDeclinedHandler extends BaseSocketHandler<CallParticipantDeclinedEvent> {
  protected readonly eventName = "call.participant-declined";
  protected readonly schema = callParticipantDeclinedSchema;

  protected handle(data: CallParticipantDeclinedEvent): void {
    this.updateStore((state) => {
      if (state.session.id === data.callId) {
        state.session.status = "IDLE";
      }
    });

    eventBus.emit(
      SdkEventType.CALL_DECLINED,
      {
        callId: data.callId,
        participantId: data.participantId,
        reason: "declined",
        timestamp: Date.now(),
      },
      "socket"
    );
  }
}
