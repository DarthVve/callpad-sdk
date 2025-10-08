import type {CallActionResponse, CallResponse, InitiateCallParams, SignalClient,} from "../core/signal";
import type {AuthManager} from "../core";
import {eventBus, SdkEventType} from "../core/events";
import {rtcStore} from "../state/store";
import type {SessionStatus} from "../state/types";
import {createLogger} from "../utils/logger";

export interface CallActions {
  initiate: (params: InitiateCallParams) => Promise<CallResponse>;
  accept: (callId: string) => Promise<CallActionResponse>;
  decline: (callId: string, reason?: string) => Promise<CallActionResponse>;
  leave: (callId: string) => Promise<CallActionResponse>;
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
      return await signal.leave(callId);
  }

  return {
    initiate,
    accept,
    decline,
    leave,
  };
}
