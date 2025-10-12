import { SdkEventType, eventBus } from "../../events";
import { pushStaleEventError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import type { CallMissedEvent } from "../../../generated/socket";
import { callMissedSchema } from "../../../generated/socket";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles call missed (call:missed)
 *
 * Clears session when all participants declined/missed
 * This is sent to the HOST when nobody answered
 */
export class SessionMissedHandler extends BaseSocketHandler<CallMissedEvent> {
  protected readonly eventName = "call:missed";
  protected readonly schema = callMissedSchema;

  protected handle(data: CallMissedEvent): void {
    const currentState = rtcStore.getState();

    this.logger.info("Call missed by all participants", {
      callId: data.callId,
    });

    // Verify this matches our current session
    if (currentState.session?.id !== data.callId) {
      pushStaleEventError("call:missed", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session?.id,
      });
      this.logger.warn("Ignoring missed call for different session", { callId: data.callId });
      return;
    }

    this.updateStore((state) => {
      state.initiated = false;
      state.session = null;
      state.outgoingInvites = {};
      state.room.participants = {};
    });

    // Emit SDK event
    eventBus.emit(SdkEventType.CALL_TIMEOUT, {
      callId: data.callId,
      reason: "All participants missed/declined",
      timestamp: Date.now(),
    });

    this.logger.debug("Session cleared - call was missed by all");
  }
}
