import type { Participant } from "../../../state/types";
import { BaseSocketHandler } from "./base.handler";
import { callCanceledSchema } from "./schema";
import type { CallCanceledEvent } from "./schema";

export class CallCanceledHandler extends BaseSocketHandler<CallCanceledEvent> {
  protected readonly eventName = "call.canceled";
  protected readonly schema = callCanceledSchema;

  protected handle(data: CallCanceledEvent): void {
    const reason = data.reason || "canceled";
    this.logger.info(`Call canceled: ${reason}`, {
      callId: data.callId,
      by: data.by?.id,
    });

    this.updateStore((state) => {
      if (state.session.id === data.callId) {
        state.session.status = "ENDED";
        state.incomingCall = undefined;

        // Clear all participants
        for (const participant of Object.values(
          state.room.participants
        ) as Participant[]) {
          participant.callState = "LEFT";
          if (!participant.leftAt) {
            participant.leftAt = data.timestamp || Date.now();
          }
        }
      }
    });
  }
}
