import { ConnectionState as LivekitConnectionState } from "livekit-client";
import { useConnectionState as useLivekitConnectionState } from "../livekit";
import { useAutoConnectRoom } from "./useAutoConnectRoom";
import { useCallState } from "./useCallState";

export type ConnectionState =
  | "pending"
  | "connecting"
  | "active"
  | "idle"
  | "ended";

export function useConnectionState(): ConnectionState {
  const room = useAutoConnectRoom();
  const livekitState = useLivekitConnectionState(room);
  const callState = useCallState();

  if (livekitState !== LivekitConnectionState.Disconnected) {
    switch (livekitState) {
      case LivekitConnectionState.Connecting:
      case LivekitConnectionState.Reconnecting:
        return "connecting";
      case LivekitConnectionState.Connected:
        return "active";
      default:
        // For any other LiveKit states, fall through to Zustand state
        break;
    }
  }

  if (!callState.status) {
    return "idle";
  }

  switch (callState.status) {
    case "pending":
      return "pending";
    case "ready":
      return "connecting";
    case "active":
      return "active";
    case "ended":
      return "ended";
    default:
      return "idle";
  }
}
