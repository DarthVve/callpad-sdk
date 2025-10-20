import type { CallCancelledEvent } from "../../../generated/socket";
import { callCancelledSchema } from "../../../generated/socket";
import { pushStaleEventError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles call session cancelled (call:cancelled)
 *
 * Clears session when call is fully cancelled (no active participants)
 * This is sent to the HOST when their outbound call is cancelled
 */
export class SessionCancelledHandler extends BaseSocketHandler<CallCancelledEvent> {
  protected readonly eventName = "call:cancelled";
  protected readonly schema = callCancelledSchema;

  protected handle(data: CallCancelledEvent): void {
    const currentState = rtcStore.getState();

    this.logger.info("Call session cancelled", {
      callId: data.callId,
      status: data.status,
    });

    // Verify this matches our current session
    if (currentState.session?.id !== data.callId) {
      pushStaleEventError("call:cancelled", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session?.id,
      });
      this.logger.warn("Ignoring cancel event for different call", {
        callId: data.callId,
      });
      return;
    }

    rtcStore.getState().reset();

    // Emit SDK event
    eventBus.emit(SdkEventType.CALL_CANCELED, {
      callId: data.callId,
      reason: "cancelled by host",
      timestamp: Date.now(),
    });

    this.logger.debug("Session cleared due to cancellation");
  }
}
