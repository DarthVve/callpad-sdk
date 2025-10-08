import { extractCallerInfo } from "../../../utils/participant-adapter";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";
import { callIncomingSchema } from "./schema";
import type { CallIncomingEvent } from "./schema";

export class CallIncomingHandler extends BaseSocketHandler<CallIncomingEvent> {
  protected readonly eventName = "call.incoming";
  protected readonly schema = callIncomingSchema;

  protected handle(data: CallIncomingEvent): void {
    const callerInfo = extractCallerInfo(data.participants);

    if (!callerInfo) {
      this.logger.error("No active caller found in participants", data);
      return;
    }

    this.updateStore((state) => {
      state.session = {
        id: data.callId,
        status: "RINGING",
        mode: data.type,
        initiatedByMe: false,
      };

      // Participants will be populated by LiveKit EventBridge when they connect
      state.room.participants = {};
    });

    eventBus.emit(
      SdkEventType.CALL_INCOMING,
      {
        callId: data.callId,
        caller: callerInfo,
        type: data.type,
        timestamp: data.timestamp,
        participants: data.participants,
      },
      "socket"
    );

    this.logger.debug("Incoming call event emitted", {
      callId: data.callId,
      caller: callerInfo.name,
      type: data.type,
    });
  }
}
