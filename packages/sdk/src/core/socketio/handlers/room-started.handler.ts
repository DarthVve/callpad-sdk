import type { CallRoomStartedEvent } from "../../../generated/socket";
import { callRoomStartedSchema } from "../../../generated/socket";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles LiveKit room started (call:roomStarted)
 *
 * Updates session status to "active" when LiveKit room is confirmed running
 */
export class RoomStartedHandler extends BaseSocketHandler<CallRoomStartedEvent> {
  protected readonly eventName = "call:roomStarted";
  protected readonly schema = callRoomStartedSchema;

  protected handle(data: CallRoomStartedEvent): void {
    this.logger.info("LiveKit room started", {
      callId: data.callId,
      roomName: data.roomName,
    });

    this.updateStore((state) => {
      if (state.session) {
        state.session.status = data.status;
      }
    });

    // Emit SDK event
    eventBus.emit(SdkEventType.CALL_STARTED, {
      callId: data.callId,
      roomName: data.roomName,
      timestamp: Date.now(),
    });

    this.logger.debug("Session status updated to active");
  }
}
