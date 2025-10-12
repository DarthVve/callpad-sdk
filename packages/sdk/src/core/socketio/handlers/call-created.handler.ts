import { SdkEventType, eventBus } from "../../events";
import type { CallCreatedEvent } from "../../../generated/socket";
import { callCreatedSchema } from "../../../generated/socket";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles call session created (call:created)
 *
 * Creates session state when caller initiates a call
 * This is the outbound call flow (I'm the HOST)
 */
export class SessionCreatedHandler extends BaseSocketHandler<CallCreatedEvent> {
  protected readonly eventName = "call:created";
  protected readonly schema = callCreatedSchema;

  protected handle(data: CallCreatedEvent): void {
    this.logger.info("Call session created", {
      callId: data.callId,
      roomName: data.roomName,
      host: data.host.userId,
      participantCount: data.participants.length,
    });

    this.updateStore((state) => {
      state.initiated = true;

      state.session = {
        id: data.callId,
        status: "pending",
        mode: "VIDEO",
        role: "HOST",
      };

      state.outgoingInvites = {};
    });

    // Emit SDK event
    eventBus.emit(SdkEventType.CALL_INITIATED, {
      callId: data.callId,
      participants: data.participants.map((p) => p.userId),
      type: "VIDEO", // Default, TODO: get from API request context
      timestamp: Date.now(),
    });

    this.logger.debug("Session created for outbound call");
  }
}
