import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";
import { callJoinInfoSchema } from "./schema";
import type { CallJoinInfoEvent } from "./schema";

export class CallJoinInfoHandler extends BaseSocketHandler<CallJoinInfoEvent> {
  protected readonly eventName = "call.join-info";
  protected readonly schema = callJoinInfoSchema;

  protected async handle(data: CallJoinInfoEvent): Promise<void> {
    this.updateStore((state) => {
      state.session.livekitInfo = {
        token: data.token,
        url: data.url,
        roomName: data.roomName,
        callId: data.callId,
      };
      state.session.status = "READY_TO_JOIN";
    });

    eventBus.emit(
      SdkEventType.JOIN_INFO_RECEIVED,
      {
        callId: data.callId,
        timestamp: Date.now(),
        url: data.url,
        roomName: data.roomName,
        token: data.token,
      },
      "socket"
    );
  }
}
