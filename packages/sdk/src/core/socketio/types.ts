export interface ConnectionConfig {
  reconnectAttempts?: number;
  reconnectDelay?: number;
  reconnectDelayMax?: number;
  timeout?: number;
}

export interface ConnectionEvents {
  "connection.state": {
    state: ConnectionState;
    previousState: ConnectionState;
  };
  "connection.error": Error;
}

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error"
  | "failed";

export interface CallIncomingEvent {
  callId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  type: "video" | "audio";
  timestamp: number;
  participants?: string[];
}

export interface CallAcceptedEvent {
  callId: string;
  acceptedBy: string;
  livekitToken: string;
  livekitUrl: string;
  timestamp: number;
}

export interface CallDeclinedEvent {
  callId: string;
  declinedBy: string;
  reason?: string;
  timestamp: number;
}

export interface CallEndedEvent {
  callId: string;
  endedBy: string;
  reason: "ended" | "timeout" | "error" | "cancelled";
  duration?: number;
  timestamp: number;
}

export interface CallJoinInfoEvent {
  callId: string;
  livekitToken: string;
  livekitUrl: string;
  participantId: string;
}

export type SocketEvents = {
  "call.incoming": CallIncomingEvent;
  "call.accepted": CallAcceptedEvent;
  "call.declined": CallDeclinedEvent;
  "call.ended": CallEndedEvent;
  "call.join-info": CallJoinInfoEvent;
};

export type EventHandler<T> = (data: T) => void;

export type EventCallback<T = any> = (data: T) => void;
export type UnsubscribeFn = () => void;
