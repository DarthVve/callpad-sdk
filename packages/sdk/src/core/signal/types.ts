import type { AuthManager } from "../auth.manager";
import type { SocketManager } from "../socketio";

export interface SignalClientConfig {
  baseUrl: string;
  appId: string;
  authManager: AuthManager;
  socketManager: SocketManager;
}

export interface CallInfo {
  id: string;
  mode: "AUDIO" | "VIDEO";
  state: "RINGING" | "ACTIVE" | "ON_HOLD" | "ENDED";
  callerId: string;
  roomName: string;
  lkRoomSid?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  participants: CallParticipant[];
}

export interface CallParticipant {
  id: string;
  userId: string;
  joinedAt?: string;
  leftAt?: string;
  lkIdentity?: string;
  lkParticipantSid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveKitJoinInfo {
  token: string;
  roomName: string;
  callId: string;
}

export interface IncomingCallEvent {
  callId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  type: "video" | "audio";
  timestamp: number;
  participants?: string[];
}

export type CallState = "RINGING" | "ACTIVE" | "ON_HOLD" | "ENDED";
export type CallMode = "AUDIO" | "VIDEO";
export type EndReason = "ended" | "timeout" | "error" | "cancelled";

export type SignalEvents = {
  "call.initiated": CallInfo;
  "call.incoming": IncomingCallEvent;
  "call.accepted": { callId: string; livekitInfo: LiveKitJoinInfo };
  "call.declined": { callId: string; reason?: string };
  "call.ended": { callId: string; reason: EndReason };
  "call.stateChanged": {
    callId: string;
    newState: CallState;
    previousState: CallState;
  };
  error: SignalError;
};

export class SignalError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "SignalError";
  }
}

export interface InitiateCallParams {
  invitees: string[];
  mode?: "AUDIO" | "VIDEO";
  metadata?: any;
}

export interface CallResponse {
  id: string;
  mode?: string;
  state?: string;
  roomName?: string;
}
