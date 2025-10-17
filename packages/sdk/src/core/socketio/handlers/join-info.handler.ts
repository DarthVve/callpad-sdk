import type { CallJoinInfoEvent } from "../../../generated/socket";
import { callJoinInfoSchema } from "../../../generated/socket";
import { pushStaleEventError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles LiveKit join credentials (call:joinInfo)
 *
 * Sets LiveKit credentials and role in existing session
 */
export class JoinInfoHandler extends BaseSocketHandler<CallJoinInfoEvent> {
  protected readonly eventName = "call:joinInfo";
  protected readonly schema = callJoinInfoSchema;

  protected handle(data: CallJoinInfoEvent): void {
    const currentState = rtcStore.getState();

    this.logger.info("Received LiveKit join info", {
      callId: data.callId,
      roomName: data.roomName,
      role: data.role,
    });

    // Verify this matches our current session
    if (currentState.session?.id !== data.callId) {
      pushStaleEventError("call:joinInfo", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session?.id,
      });
      this.logger.warn("Ignoring join info for unknown call", {
        callId: data.callId,
      });
      return;
    }

    this.updateStore((state) => {
      if (state.session?.id === data.callId) {
        state.session.livekitInfo = {
          token: data.token,
          roomName: data.roomName,
          url: data.lkUrl,
        };
        state.session.role = data.role;
      }
    });

    // Emit SDK event
    eventBus.emit(SdkEventType.JOIN_INFO_RECEIVED, {
      callId: data.callId,
      participantId: data.participantId || "",
      timestamp: Date.now(),
      url: data.lkUrl,
      token: data.token,
    });

    this.logger.debug("Session updated with LiveKit credentials");
  }
}
