import { useConnectionState as useLivekitConnectionState } from "@livekit/components-react";
import {  ConnectionState as LivekitConnectionState } from "livekit-client"
import {useCallState} from "./useCallState";

export type ConnectionState =
  | "pending"
  | "connecting"
  | "active"
  | "idle"
  | "ended";

export function useConnectionState(): ConnectionState {
    const { status } = useCallState()
    const connectionState = useLivekitConnectionState()

    if (connectionState === LivekitConnectionState.Connected) {
        return "active"
    }

    if (connectionState === LivekitConnectionState.Connecting || connectionState === LivekitConnectionState.Reconnecting) {
        return "connecting"
    }

    if (status === "pending") {
        return "pending"
    }

    if (status === "ended") {
        return "ended"
    }

    return "idle"
}
