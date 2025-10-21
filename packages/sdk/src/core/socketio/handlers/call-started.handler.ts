import type { CallStartedEvent } from "../../../generated/socket";
import { callStartedSchema } from "../../../generated/socket";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles call started event (call:started)
 *
 * Updates session status to "active" and records start time
 */
export class CallStartedHandler extends BaseSocketHandler<CallStartedEvent> {
  protected readonly eventName = "call:started";
  protected readonly schema = callStartedSchema;

  protected handle(data: CallStartedEvent): void {
    this.logger.info("Call started", {
      callId: data.callId,
      startedAt: data.startedAt,
    });

    this.updateStore((state) => {
      if (state.session && state.session.id === data.callId) {
        state.session.status = "active";
        state.session.startedAt = data.startedAt;
      }
    });

    eventBus.emit(SdkEventType.CALL_STARTED, {
      callId: data.callId,
      startedAt: data.startedAt,
    });

    this.logger.debug("Call status updated to active");
  }
}
