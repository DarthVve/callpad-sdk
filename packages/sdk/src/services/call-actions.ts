import type {
  CallResponse,
  InitiateCallParams,
  SignalClient,
} from "../core/signal";
import { rtcStore } from "../state/store";

export interface CallActions {
  initiate: (params: InitiateCallParams) => Promise<CallResponse>;
  accept: (callId: string) => Promise<void>;
  decline: (callId: string, reason?: string) => Promise<void>;
  end: (callId: string) => Promise<void>;
}

export function createCallActions(signal: SignalClient): CallActions {
  async function initiate(params: InitiateCallParams): Promise<CallResponse> {
    const response = await signal.initiate(params);

    rtcStore.getState().patch((state) => {
      state.session = {
        id: response.id,
        status: "ringing",
        mode: (params.mode?.toLowerCase() as "audio" | "video") || "audio",
        roomName: response.roomName,
      };
    });

    return response;
  }

  async function accept(callId: string): Promise<void> {
    await signal.accept(callId);

    rtcStore.getState().patch((state) => {
      state.session = {
        ...state.session,
        id: callId,
        status: "accepted",
      };
      // Clear incoming call
      state.incomingCall = undefined;
    });
  }

  async function decline(callId: string, reason?: string): Promise<void> {
    await signal.decline(callId, reason);

    rtcStore.getState().patch((state) => {
      if (state.session.id === callId) {
        state.session.status = "idle";
      }
      // Clear incoming call
      state.incomingCall = undefined;
    });
  }

  async function end(callId: string): Promise<void> {
    await signal.end(callId);

    rtcStore.getState().patch((state) => {
      if (state.session.id === callId) {
        state.session.status = "ended";
      }
    });
  }

  return {
    initiate,
    accept,
    decline,
    end,
  };
}
