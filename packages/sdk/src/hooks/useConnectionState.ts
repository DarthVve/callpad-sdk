import { useMemo } from "react";
import { useRtcStore } from "../state/store";

export type ConnectionState =
  | "pending"
  | "connecting"
  | "active"
  | "idle"
  | "ended";

export function useConnectionState(): ConnectionState {
  const sessionStatus = useRtcStore((state) => state.session?.status);

  return useMemo(() => {
    if (!sessionStatus) {
      return "idle";
    }

    switch (sessionStatus) {
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
  }, [sessionStatus]);
}
