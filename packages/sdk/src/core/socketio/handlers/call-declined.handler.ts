import type { CallDeclinedEvent } from "../../../generated/socket";
import { callDeclinedSchema } from "../../../generated/socket";
import { rtcStore } from "../../../state/store";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

export class CallDeclinedHandler extends BaseSocketHandler<CallDeclinedEvent> {
  protected readonly eventName = "call:declined";
  protected readonly schema = callDeclinedSchema;

  protected handle(data: CallDeclinedEvent): void {
    this.logger.info("Call declined by all participants", {
      callId: data.callId,
      reason: data.reason,
    });

    rtcStore.getState().reset();

    eventBus.emit(SdkEventType.CALL_DECLINED, {
      callId: data.callId,
      reason: data.reason || "All participants declined",
      timestamp: Date.now(),
    });

    this.logger.debug("Session reset due to all participants declining");
  }
}