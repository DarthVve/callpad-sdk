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
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "ERROR"
  | "FAILED";

export type EventCallback<T = any> = (data: T) => void;
export type UnsubscribeFn = () => void;
