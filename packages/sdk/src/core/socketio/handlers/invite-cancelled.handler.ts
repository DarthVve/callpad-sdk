import type { CallInviteCancelledEvent } from "../../../generated/socket";
import { callInviteCancelledSchema } from "../../../generated/socket";
import { rtcStore } from "../../../state/store";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles invitation cancelled (call:inviteCancelled)
 *
 * Clears incomingInvite when host cancels the invitation
 * Only relevant for PARTICIPANT/callee perspective
 */
export class InviteCancelledHandler extends BaseSocketHandler<CallInviteCancelledEvent> {
  protected readonly eventName = "call:inviteCancelled";
  protected readonly schema = callInviteCancelledSchema;

  protected handle(data: CallInviteCancelledEvent): void {
    const currentState = rtcStore.getState();

    this.logger.info("Invitation cancelled by host", {
      callId: data.callId,
      cancelledBy: data.cancelledByUserId,
      reason: data.reason,
    });

    // Only clear if this matches our incoming invite
    if (currentState.incomingInvite?.callId !== data.callId) {
      this.logger.debug("Ignoring cancelled invite for different call", {
        callId: data.callId,
      });
      return;
    }

    rtcStore.getState().reset();

    if (data.reason) {
      rtcStore.getState().addError({
        code: "CALL_CANCELLED",
        message: data.reason,
        timestamp: Date.now(),
        context: { callId: data.callId, cancelledBy: data.cancelledByUserId },
      });
    }

    eventBus.emit(SdkEventType.CALL_CANCELED, {
      callId: data.callId,
      reason: data.reason,
      timestamp: Date.now(),
    });

    this.logger.debug("Incoming invite cleared due to cancellation");
  }
}
