import { pushStaleEventError } from "../../../state/errors";
import { BaseSocketHandler } from "./base.handler";
import { callEndedSchema } from "./schema";
import type { CallEndedEvent } from "./schema";

export class CallEndedHandler extends BaseSocketHandler<CallEndedEvent> {
  protected readonly eventName = "call.ended";
  protected readonly schema = callEndedSchema;

  protected handle(data: CallEndedEvent): void {
    this.updateStore((state) => {
      if (state.session.id !== data.callId) {
        pushStaleEventError("call.ended", "callId mismatch", {
          eventCallId: data.callId,
          sessionCallId: state.session.id,
        });
        return;
      }

      state.session.status = "ENDED";
      state.incomingCall = undefined;

      for (const id of Object.keys(state.presence)) {
        const participant = state.presence[id];
        if (participant) {
          participant.join = "LEFT";
          if (!participant.leftAt) {
            participant.leftAt = Date.now();
          }
        }
      }
    });

    if (this.livekit) {
      this.livekit.disconnect().catch((error: any) => {
        console.error("Error disconnecting from LiveKit", error);
      });
    }
  }
}
