import { pushStaleEventError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import { BaseSocketHandler } from "./base.handler";
import { callParticipantAcceptedSchema } from "./schema";
import type { CallParticipantAcceptedEvent } from "./schema";

export class CallParticipantAcceptedHandler extends BaseSocketHandler<CallParticipantAcceptedEvent> {
  protected readonly eventName = "call.participant-accepted";
  protected readonly schema = callParticipantAcceptedSchema;

  protected async handle(data: CallParticipantAcceptedEvent): Promise<void> {
    const currentState = rtcStore.getState();

    if (currentState.session.id !== data.callId) {
      pushStaleEventError("call.participant-accepted", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session.id,
      });
      return;
    }

    this.updateStore((state) => {
      state.session.status = "ACCEPTED";
    });
  }
}
