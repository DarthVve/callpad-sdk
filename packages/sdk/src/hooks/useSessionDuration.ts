import { useEffect, useReducer } from "react";
import { useRtcStore } from "../state/store";
import { type DurationResult, computeDuration } from "../utils";

export function useSessionDuration(): DurationResult {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const session = useRtcStore((state) => state.session);

  useEffect(() => {
    if (!session?.startedAt) {
      return;
    }

    const interval = setInterval(forceUpdate, 1000);
    return () => clearInterval(interval);
  }, [session?.startedAt]);

  if (!session?.startedAt) {
    return {
      seconds: 0,
      minutes: 0,
      hours: 0,
      formatted: "00:00",
    };
  }

  return computeDuration(session.startedAt);
}
