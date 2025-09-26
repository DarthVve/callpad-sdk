import { useRtcStore } from "../state/store";

export interface ConnectionState {
  connected: boolean;
  reconnecting: boolean;
  quality?: "excellent" | "good" | "poor" | "lost";
}

export function useConnection(): ConnectionState {
  return useRtcStore((state) => state.connection);
}

export function useIsConnected(): boolean {
  return useRtcStore((state) => state.connection.connected);
}
