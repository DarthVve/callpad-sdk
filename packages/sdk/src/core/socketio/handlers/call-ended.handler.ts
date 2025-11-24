import type { CallEndedEvent } from "../../../generated/socket";
import { callEndedSchema } from "../../../generated/socket";
import { pushStaleEventError } from "../../../state/errors";
import { profileCache } from "../../../state/profileCache";
import { recordingStore } from "../../../state/recording.store";
import { rtcStore } from "../../../state/store";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles call session ended (call:ended)
 *
 * Clears session state, profile cache, and disconnects from LiveKit
 */
export class SessionEndedHandler extends BaseSocketHandler<CallEndedEvent> {
  protected readonly eventName = "call:ended";
  protected readonly schema = callEndedSchema;

  protected handle(data: CallEndedEvent): void {
    const currentState = rtcStore.getState();

    this.logger.info("Call session ended", {
      callId: data.callId,
      endedAt: data.endedAt,
      endedBy: data.endedByUserId,
    });

    if (currentState.session?.id !== data.callId) {
      pushStaleEventError("call:ended", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session?.id,
      });
      this.logger.warn("Ignoring end event for different call", {
        callId: data.callId,
      });
      return;
    }

    this.updateStore((state) => {
      if (state.session) {
        state.session.status = "ended";
      }
    });

    rtcStore.getState().reset();
    profileCache.getState().clear();
    recordingStore.getState().clear();

    if (this.livekit) {
      this.livekit.disconnect().catch((error: any) => {
        this.logger.error("Error disconnecting from LiveKit", { error });
      });
    }

    eventBus.emit(SdkEventType.CALL_ENDED, {
      callId: data.callId,
      endedAt: data.endedAt,
      endedBy: data.endedByUserId,
      timestamp: Date.now(),
    });

    this.logger.debug("Session cleared and LiveKit disconnected");
  }
}
