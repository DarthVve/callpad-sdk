import type {
  CallActionResponse,
  CallResponse,
  InitiateCallParams,
  SignalClient,
} from "../core/signal";
import { rtcStore } from "../state/store";
import type { SessionStatus } from "../state/types";

export interface CallActions {
  initiate: (params: InitiateCallParams) => Promise<CallResponse>;
  accept: (callId: string) => Promise<CallActionResponse>;
  decline: (callId: string, reason?: string) => Promise<CallActionResponse>;
  leave: (callId: string) => Promise<CallActionResponse>;
}

export function createCallActions(signal: SignalClient): CallActions {
  async function initiate(params: InitiateCallParams): Promise<CallResponse> {
    const response = await signal.initiate(params);

    rtcStore.getState().patch((state) => {
      state.session = {
        id: response.id,
        status: response.state as SessionStatus,
        mode: response.mode as "AUDIO" | "VIDEO",
        roomName: response.roomName,
      };

      // Use participants from API response instead of request params
      for (const participant of response.participants) {
        const isCaller = participant.userId === response.callerId;
        state.profiles[participant.userId] = {
          id: participant.userId,
          firstName: `User ${participant.userId}`,
          lastName: undefined,
          avatarUrl: undefined,
        };

        state.presence[participant.userId] = {
          role: isCaller ? "CALLER" : "MEMBER",
          invite: isCaller ? "ACCEPTED" : "INVITED",
          join: "NOT_JOINED",
          invitedAt: Date.now(),
        };
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
        status: response.state as SessionStatus,
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
    const response = await signal.decline(callId);

    rtcStore.getState().patch((state) => {
      if (state.session.id === callId) {
        state.session.status = response.state as SessionStatus;
      }
      // Clear incoming call
      state.incomingCall = undefined;
    });

    return response;
  }

  async function leave(callId: string): Promise<CallActionResponse> {
    const response = await signal.leave(callId);

    // Note: Don't update local state here - let socket events handle it
    // Backend will decide whether to end the call or just mark participant as left
    // and emit appropriate socket events (call.participant-left vs call.ended)

    return response;
  }

  return {
    initiate,
    accept,
    decline,
    leave,
  };
}
