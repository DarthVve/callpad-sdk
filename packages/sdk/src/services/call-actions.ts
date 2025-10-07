import type {
  CallActionResponse,
  CallResponse,
  InitiateCallParams,
  SignalClient,
} from "../core/signal";
import type { AuthManager } from "../core/auth.manager";
import { SdkEventType, eventBus } from "../core/events";
import { pushLiveKitConnectError } from "../state/errors";
import { rtcStore } from "../state/store";
import type { SessionStatus } from "../state/types";
import { createLogger } from "../utils/logger";

export interface CallActions {
  initiate: (params: InitiateCallParams) => Promise<CallResponse>;
  accept: (callId: string) => Promise<CallActionResponse>;
  decline: (callId: string, reason?: string) => Promise<CallActionResponse>;
  leave: (callId: string) => Promise<CallActionResponse>;
  join: () => Promise<void>;
}

export function createCallActions(signal: SignalClient, auth: AuthManager, livekit?: any): CallActions {
  const logger = createLogger("call-actions");
  async function initiate(params: InitiateCallParams): Promise<CallResponse> {
    const response = await signal.initiate(params);

    rtcStore.getState().patch((state) => {
      state.session = {
        id: response.id,
        status: "CALLING", // Caller initiated, waiting for acceptance
        mode: response.mode as "AUDIO" | "VIDEO",
        // Identity context: I initiated this call, so I'm the caller
        myRole: "CALLER",
        initiatedByMe: true,
      };

      state.room.participants = {};
      
      logger.debug("Call initiated - waiting for participants to join", {
        callId: response.id,
        invitedCount: response.participants?.length || 0,
      });
    });

    return response;
  }

  async function accept(callId: string): Promise<CallActionResponse> {
    const response = await signal.accept(callId);

    rtcStore.getState().patch((state) => {
      state.session = {
        ...state.session,
        id: callId,
        status: "ACCEPTED", // Call accepted but not yet joined media
        myRole: "CALLEE",
        initiatedByMe: false,
      };
      
      // Participants will be populated by LiveKit EventBridge when they connect
      // No need to pre-populate from API response
      state.room.participants = {};
    });

    // Note: No longer emitting CALL_ACCEPTED event as it's been removed
    // UI components should rely on session state changes instead

    return response;
  }

  async function decline(
    callId: string,
    reason?: string
  ): Promise<CallActionResponse> {
    logger.debug("Starting decline action", { callId, reason });

    try {
      const response = await signal.decline(callId);
      logger.info("Decline API success", { callId, response });

      rtcStore.getState().patch((state) => {
        if (state.session.id === callId) {
          state.session.status = response.state as SessionStatus;
        }
      });

      eventBus.emit(SdkEventType.CALL_DECLINED, {
        callId,
        reason,
        timestamp: Date.now(),
      }, "user");

      return response;
    } catch (error) {
      logger.error("Decline API failed", { callId, error });

      rtcStore.getState().patch((state) => {
        state.session.status = "IDLE";
        logger.warn("Force-cleared session due to API failure");
      });

      eventBus.emit(SdkEventType.CALL_DECLINED, {
        callId,
        reason: "api_error",
        timestamp: Date.now(),
      }, "user");

      throw error;
    }
  }

  async function leave(callId: string): Promise<CallActionResponse> {
    const response = await signal.leave(callId);

    // Note: Don't update local state here - let socket events handle it
    // Backend will decide whether to end the call or just mark participant as left
    // and emit appropriate socket events (call.participant-left vs call.ended)

    return response;
  }

  async function join(): Promise<void> {
    const currentState = rtcStore.getState();
    const joinInfo = currentState.session.livekitInfo;

    if (!joinInfo) {
      throw new Error("No join info available - cannot join call");
    }

    if (!joinInfo.url) {
      throw new Error("No LiveKit URL available - cannot join call");
    }

    if (!livekit) {
      throw new Error("LiveKit service not available");
    }

    if (currentState.session.status === "ACTIVE") {
      logger.warn("Already in active call, ignoring join request");
      return;
    }

    try {
      logger.info("Manually joining LiveKit room", {
        callId: joinInfo.callId,
        roomName: joinInfo.roomName,
      });

      // Update state to connecting
      rtcStore.getState().patch((state) => {
        state.session.status = "CONNECTING";
      });

      await livekit.joinRoom(joinInfo.token, joinInfo.url);

      // Update state after successful join
      rtcStore.getState().patch((state) => {
        state.session.status = "ACTIVE";
      });

      logger.info("Successfully joined LiveKit room manually", {
        callId: joinInfo.callId,
      });

    } catch (error) {
      logger.error("Failed to manually join LiveKit room", {
        callId: joinInfo.callId,
        error,
      });

      // Reset state on failure
      rtcStore.getState().patch((state) => {
        state.session.status = "READY_TO_JOIN";
      });

      pushLiveKitConnectError(
        error instanceof Error ? error.message : "Unknown error",
        error
      );

      throw error;
    }
  }

  return {
    initiate,
    accept,
    decline,
    leave,
    join,
  };
}
