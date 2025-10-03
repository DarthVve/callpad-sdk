import {
  pushLiveKitConnectError,
  pushStaleEventError,
} from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import { BaseSocketHandler } from "./base.handler";
import { callJoinInfoSchema } from "./schema";
import type { CallJoinInfoEvent } from "./schema";

export class CallJoinInfoHandler extends BaseSocketHandler<CallJoinInfoEvent> {
  protected readonly eventName = "call.join-info";
  protected readonly schema = callJoinInfoSchema;

  protected async handle(data: CallJoinInfoEvent): Promise<void> {
    const recipientId = data.for.id;
    const currentSessionId = this.getSessionId();

    if (currentSessionId !== data.callId) {
      pushStaleEventError("call.join-info", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentSessionId,
      });
      return;
    }

    if (this.livekit?.room.state === "connected") {
      console.warn("Already connected to LiveKit, ignoring join-info");
      return;
    }

    this.updateStore((state) => {
      state.session.livekitInfo = {
        token: data.token,
        roomName: data.roomName,
        callId: data.callId,
      };

      if (state.presence[recipientId]) {
        state.presence[recipientId].join = "JOINING";
      }
    });

    if (this.livekit) {
      try {
        if (!data.url) {
          throw new Error("LiveKit URL not provided in join info");
        }

        await this.livekit.joinRoom(data.token, data.url);

        this.updateStore((state) => {
          state.session.status = "ACTIVE";
          if (state.presence[recipientId]) {
            state.presence[recipientId].join = "JOINED";
            state.presence[recipientId].joinedAt = Date.now();
          }
        });
      } catch (error) {
        console.error("Failed to auto-join LiveKit room", error);

        this.updateStore((state) => {
          if (state.presence[recipientId]) {
            state.presence[recipientId].join = "NOT_JOINED";
          }
        });

        pushLiveKitConnectError(
          error instanceof Error ? error.message : "Unknown error",
          error
        );
      }
    } else {
      pushLiveKitConnectError("LiveKit service not available", null);
    }
  }

  private getSessionId(): string {
    return rtcStore.getState().session.id || "";
  }
}
