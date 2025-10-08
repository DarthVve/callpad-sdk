import {
  pushLiveKitConnectError,
  pushStaleEventError,
} from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";
import { callJoinInfoSchema } from "./schema";
import type { CallJoinInfoEvent } from "./schema";

export class CallJoinInfoHandler extends BaseSocketHandler<CallJoinInfoEvent> {
  protected readonly eventName = "call.join-info";
  protected readonly schema = callJoinInfoSchema;

  protected async handle(data: CallJoinInfoEvent): Promise<void> {
    const currentState = rtcStore.getState();
    const currentSessionId = this.getSessionId();

    // if (currentSessionId !== data.callId) {
    //   this.logger.error("CallId mismatch in join-info event", {
    //     eventCallId: data.callId,
    //     sessionCallId: currentSessionId,
    //   });
    //   pushStaleEventError("call.join-info", "callId mismatch", {
    //     eventCallId: data.callId,
    //     sessionCallId: currentSessionId,
    //   });
    //   return;
    // }

    if (this.livekit?.room.state === "connected") {
      this.logger.warn("Already connected to LiveKit, ignoring join-info", {
        callId: data.callId,
        currentRoomState: this.livekit.room.state,
      });
      return;
    }

    // Store join info and set ready to join
    this.updateStore((state) => {
      state.session.livekitInfo = {
        token: data.token,
        roomName: data.roomName,
        callId: data.callId,
        url: data.url,
      };

      // Always set READY_TO_JOIN when receiving join-info
      // Backend controls when to send join-info, so we trust it
      state.session.status = "READY_TO_JOIN";
    });

    // Simplified auto-join logic: auto-join if enabled
    const shouldAutoJoin = this.autoJoinConfig?.enabled;

    if (shouldAutoJoin && this.livekit && data.url) {
      try {
        this.logger.info("Auto-joining LiveKit room after receiving join-info", {
          callId: data.callId,
        });

        // Update state to connecting before joining
        this.updateStore((state) => {
          state.session.status = "CONNECTING";
        });

        const joinSuccess = this.autoJoinConfig?.retryOnFailure
          ? await this.retryAutoJoin(data.callId, data.token, data.url)
          : await this.livekit.joinRoom(data.token, data.url).then(() => true).catch(() => false);

        if (joinSuccess) {
          // Update state after successful join
          this.updateStore((state) => {
            state.session.status = "ACTIVE";
          });

          this.logger.info("Successfully auto-joined LiveKit room", {
            callId: data.callId,
            retriesUsed: this.autoJoinConfig?.retryOnFailure,
          });
        } else {
          throw new Error("Auto-join failed after retries");
        }

      } catch (error) {
        this.logger.error("Failed to auto-join to LiveKit room", {
          callId: data.callId,
          error,
        });

        // Reset state on failure
        this.updateStore((state) => {
          state.session.status = "READY_TO_JOIN"; // Ready for manual join
        });

        pushLiveKitConnectError(
          error instanceof Error ? error.message : "Unknown error",
          error
        );

        // Don't throw error - allow manual join as fallback
        this.logger.warn("Auto-join failed, user can manually join", {
          callId: data.callId,
        });
      }
    }

    // Emit join info received event
    eventBus.emit(
      SdkEventType.JOIN_INFO_RECEIVED,
      {
        callId: data.callId,
        participantId: "pending",
        timestamp: Date.now(),
        hasUrl: !!data.url,
        hasToken: !!data.token,
        autoJoined: shouldAutoJoin,
      },
      "socket"
    );
  }

  private getSessionId(): string {
    return rtcStore.getState().session.id || "";
  }
}
