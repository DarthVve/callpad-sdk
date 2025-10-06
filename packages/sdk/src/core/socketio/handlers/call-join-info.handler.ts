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
    // Get current user ID from auth instead of localParticipantId
    const currentUserId = this.authManager?.getCurrentUserId();
    
    const currentSessionId = this.getSessionId();

    if (currentSessionId !== data.callId) {
      this.logger.error("CallId mismatch in join-info event", {
        eventCallId: data.callId,
        sessionCallId: currentSessionId,
        currentUserId,
      });
      pushStaleEventError("call.join-info", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentSessionId,
      });
      return;
    }

    if (this.livekit?.room.state === "connected") {
      this.logger.warn("Already connected to LiveKit, ignoring join-info", {
        callId: data.callId,
        currentUserId,
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

    // Simplified auto-join logic: auto-join if enabled and user exists
    const shouldAutoJoin = this.autoJoinConfig?.enabled && currentUserId;

    if (shouldAutoJoin && this.livekit && data.url) {
      try {
        this.logger.info("Auto-joining LiveKit room after receiving join-info", {
          callId: data.callId,
          currentUserId,
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
            if (currentUserId) {
              // Defensive check: create participant if it doesn't exist
              if (!state.room.participants[currentUserId]) {
                this.logger.warn("Creating missing participant during auto-join", {
                  currentUserId,
                  callId: data.callId,
                });
                
                state.room.participants[currentUserId] = {
                  id: currentUserId,
                  role: state.session.myRole || "MEMBER",
                  callState: "INVITED",
                  invitedAt: Date.now(),
                  audioEnabled: true,
                  videoEnabled: true,
                  isSpeaking: false,
                };
              }
              
              state.room.participants[currentUserId].callState = "JOINED";
              state.room.participants[currentUserId].joinedAt = Date.now();
              
              this.logger.debug("Participant joined during auto-join", {
                participantId: currentUserId,
                callState: "JOINED",
                callId: data.callId,
              });
            }
          });

          // Emit participant joined event
          eventBus.emit(
            SdkEventType.PARTICIPANT_JOINED,
            {
              callId: data.callId,
              participant: {
                id: currentUserId,
                role: currentState.session.myRole || "MEMBER",
              },
              timestamp: Date.now(),
            },
            "socket"
          );

          this.logger.info("Successfully auto-joined LiveKit room", {
            callId: data.callId,
            currentUserId,
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
          if (currentUserId) {
            // Defensive check: only update if participant exists
            if (state.room.participants[currentUserId]) {
              state.room.participants[currentUserId].callState = "LEFT";
            }
          }
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
        participantId: currentUserId || "unknown",
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
