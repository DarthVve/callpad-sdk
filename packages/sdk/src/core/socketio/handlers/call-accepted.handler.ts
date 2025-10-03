import { pushStaleEventError } from "../../../state/errors";
import { BaseSocketHandler } from "./base.handler";
import { callAcceptedSchema } from "./schema";
import type { CallAcceptedEvent } from "./schema";

export class CallAcceptedHandler extends BaseSocketHandler<CallAcceptedEvent> {
  protected readonly eventName = "call.accepted";
  protected readonly schema = callAcceptedSchema;

  protected handle(data: CallAcceptedEvent): void {
    this.updateStore((state) => {
      if (state.session.id !== data.callId) {
        pushStaleEventError("call.accepted", "callId mismatch", {
          eventCallId: data.callId,
          sessionCallId: state.session.id,
        });
        return;
      }

      state.session.status = "ACCEPTED";
      const participant = state.presence[data.by.id];
      if (participant) {
        participant.invite = "ACCEPTED";
        participant.acceptedAt = data.by.acceptedAt || Date.now();
      }
    });
  }
}
