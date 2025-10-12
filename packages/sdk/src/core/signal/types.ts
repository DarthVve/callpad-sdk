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
  type: "VIDEO" | "AUDIO";
  timestamp: number;
  participants?: string[];
}

export type CallState = "RINGING" | "ACTIVE" | "ON_HOLD" | "ENDED";
export type CallMode = "AUDIO" | "VIDEO";
export type EndReason = "ENDED" | "TIMEOUT" | "ERROR" | "CANCELLED";

export interface InitiateCallParams {
  invitees: string[];
  mode?: "AUDIO" | "VIDEO";
  metadata?: any;
}

export interface ApiConfig {
  baseUrl: string;
  token?: string | (() => Promise<string> | string);
  credentials?: "include" | "omit" | "same-origin";
  withCredentials?: boolean;
  headers?: Record<string, string>;
}

// Backend API Response Types
export interface CallResponse {
  id: string;
  mode: "AUDIO" | "VIDEO";
  state: "RINGING" | "ACTIVE" | "ON_HOLD" | "ENDED";
  callerId: string;
  roomName: string;
  lkRoomSid?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  participants: Array<{
    id: string;
    userId: string;
    joinedAt?: string;
    leftAt?: string;
    lkIdentity?: string;
    lkParticipantSid?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface CallActionResponse {
  callId: string;
  state: "RINGING" | "ACTIVE" | "ON_HOLD" | "ENDED";
  message: string;
  token?: string;
  roomName?: string;
}
