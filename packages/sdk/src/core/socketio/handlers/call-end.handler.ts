import type { CallEndEvent } from "../../../generated/socket";
import { callEndSchema } from "../../../generated/socket";
import { pushStaleEventError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles call end event (call:end)
 *
 * Clears session state and triggers auto-disconnect
 */
export class CallEndHandler extends BaseSocketHandler<CallEndEvent> {
  protected readonly eventName = "call:end";
  protected readonly schema = callEndSchema;

  protected handle(data: CallEndEvent): void {
    const currentState = rtcStore.getState();

    this.logger.info("Call ended by user", {
      callId: data.callId,
      endedBy: data.endedByUserId,
    });

    // Verify this matches our current session
    if (currentState.session?.id !== data.callId) {
      pushStaleEventError("call:end", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session?.id,
      });
      this.logger.warn("Ignoring end event for different call", {
        callId: data.callId,
      });
      return;
    }

    // Complete state reset (triggers auto-disconnect)
    rtcStore.getState().reset();

    // Emit SDK event
    eventBus.emit(SdkEventType.CALL_ENDED, {
      callId: data.callId,
      endedBy: data.endedByUserId,
      reason: "ended_by_user",
      timestamp: Date.now(),
    });

    this.logger.debug("Session cleared, auto-disconnect triggered");
  }
}