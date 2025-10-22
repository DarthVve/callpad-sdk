import type { CallReadyEvent } from "../../../generated/socket";
import { callReadySchema } from "../../../generated/socket";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles call ready event (call:ready)
 *
 * Updates session status to "ready" when backend confirms call is ready to connect
 */
export class CallReadyHandler extends BaseSocketHandler<CallReadyEvent> {
  protected readonly eventName = "call:ready";
  protected readonly schema = callReadySchema;

  protected handle(data: CallReadyEvent): void {
    this.logger.info("Call ready", {
      callId: data.callId,
      message: data.message,
      userId: data.userId,
    });

    this.updateStore((state) => {
      if (state.session && state.session.id === data.callId) {
        if (state.session.status === "pending") {
          state.session.status = "ready";
          state.session.startedAt = new Date().toISOString();
        }
      }
    });

    this.logger.debug("Call status updated to ready");
  }
}
