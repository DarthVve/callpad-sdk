import type { Participant } from "../../../state/types";
import { BaseSocketHandler } from "./base.handler";
import { callTimeoutSchema } from "./schema";
import type { CallTimeoutEvent } from "./schema";

export class CallTimeoutHandler extends BaseSocketHandler<CallTimeoutEvent> {
  protected readonly eventName = "call.timeout";
  protected readonly schema = callTimeoutSchema;

  protected handle(data: CallTimeoutEvent): void {
    const reason = data.reason || "timeout";
    this.logger.info(`Call timeout: ${reason}`, { callId: data.callId });

    this.updateStore((state) => {
      if (state.session.id === data.callId) {
        state.session.status = "ENDED";

        state.room.participants = {};
      }
    });
  }
}
