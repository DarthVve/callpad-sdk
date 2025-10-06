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

      // Use participants from API response instead of request params
      for (const participant of response.participants) {
        const isCaller = participant.userId === response.callerId;
        // Use userId as the key since that's what auth.getCurrentUserId() returns
        const participantData: any = {
          id: participant.userId, // Store the user ID as the participant ID
          role: isCaller ? "CALLER" : "MEMBER",
          callState: isCaller ? "JOINED" : "INVITED", // Caller is already in the call
          invitedAt: Date.now(),
          audioEnabled: true,
          videoEnabled: true,
          isSpeaking: false,
        };
        
        // Set joinedAt only for caller
        if (isCaller) {
          participantData.joinedAt = Date.now();
        }
        
        state.room.participants[participant.userId] = participantData;
        
        logger.debug("Created participant during call initiation", {
          participantId: participant.userId,
          role: isCaller ? "CALLER" : "MEMBER",
          callState: "INVITED",
          callId: response.id,
        });
      }
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
        // Identity context: I accepted this call, so I'm the callee
        myRole: "CALLEE",
        initiatedByMe: false,
      };
      // Clear incoming call
      state.incomingCall = undefined;

      // Note: Self presence will be updated via socket events from backend
      // The backend will emit call.accepted event with participant info
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
        // Clear incoming call
        state.incomingCall = undefined;
        logger.debug("Cleared incomingCall state");
      });

      return response;
    } catch (error) {
      logger.error("Decline API failed", { callId, error });

      // Even if API fails, clear the incoming call to prevent stuck modal
      rtcStore.getState().patch((state) => {
        state.incomingCall = undefined;
        state.session.status = "IDLE";
        logger.warn("Force-cleared state due to API failure");
      });

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

    // Get current user ID from auth instead of localParticipantId
    const currentUserId = auth.getCurrentUserId();

    try {
      logger.info("Manually joining LiveKit room", {
        callId: joinInfo.callId,
        currentUserId,
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
        if (currentUserId) {
          // Defensive check: create participant if it doesn't exist
          if (!state.room.participants[currentUserId]) {
            logger.warn("Creating missing participant during manual join", {
              currentUserId,
              callId: joinInfo.callId,
            });
            
            state.room.participants[currentUserId] = {
              id: currentUserId,
              firstName: `User ${currentUserId}`,
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
          
          logger.debug("Participant joined during manual join", {
            participantId: currentUserId,
            callState: "JOINED",
            callId: joinInfo.callId,
          });
        }
      });

      // Emit participant joined event using session role context
      eventBus.emit(
        SdkEventType.PARTICIPANT_JOINED,
        {
          callId: joinInfo.callId,
          participant: {
            id: currentUserId || "unknown",
            role: currentState.session.myRole || "CALLEE",
          },
          timestamp: Date.now(),
        },
        "user"
      );

      logger.info("Successfully joined LiveKit room manually", {
        callId: joinInfo.callId,
        currentUserId,
      });

    } catch (error) {
      logger.error("Failed to manually join LiveKit room", {
        callId: joinInfo.callId,
        error,
      });

      // Reset state on failure
      rtcStore.getState().patch((state) => {
        state.session.status = "READY_TO_JOIN";
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
