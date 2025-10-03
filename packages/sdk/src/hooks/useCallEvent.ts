import { useCallback, useEffect, useRef, useState } from "react";
import { useRtcStore } from "../state/store";

export interface CallEventOptions<T = any> {
  onEvent?: (data: T) => void;
  persistent?: boolean;
  autoReset?: boolean;
}

export function useCallEvent<T = any>(
  event: string,
  optionsOrCallback?: CallEventOptions<T> | ((data: T) => void)
): {
  data: T | undefined;
  clear: () => void;
} {
  const [eventData, setEventData] = useState<T | undefined>(undefined);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  // Handle both callback function and options object
  const options =
    typeof optionsOrCallback === "function"
      ? { onEvent: optionsOrCallback }
      : optionsOrCallback || {};

  const { onEvent, persistent = false, autoReset = true } = options;

  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const clear = useCallback(() => {
    setEventData(undefined);
  }, []);

  // Watch store changes for specific events
  const incomingCall = useRtcStore((state) => state.incomingCall);
  const sessionStatus = useRtcStore((state) => state.session.status);
  const sessionId = useRtcStore((state) => state.session.id);

  useEffect(() => {
    let data: T | undefined = undefined;

    // Track status changes for proper event detection
    if (previousStatus !== sessionStatus) {
      setPreviousStatus(sessionStatus);
    }

    // Map events to store values with proper transition logic
    switch (event) {
      case "call.incoming":
        if (incomingCall) {
          data = incomingCall as T;
        }
        break;
      case "call.accepted":
        // Only trigger when transitioning to ACCEPTED status
        if (sessionStatus === "ACCEPTED" && previousStatus !== "ACCEPTED" && sessionId) {
          data = { status: sessionStatus } as T;
        }
        break;
      case "call.declined":
        // Note: call.declined events are handled by socket events only
        // Don't generate fake events from status transitions
        break;
      case "call.ended":
        // Only trigger when transitioning to ENDED status
        if (sessionStatus === "ENDED" && previousStatus !== "ENDED" && sessionId) {
          data = { status: sessionStatus } as T;
        }
        break;
      default:
        // For other events, we can't easily map to store state
        break;
    }

    if (data && JSON.stringify(data) !== JSON.stringify(eventData)) {
      console.log(`🎯 useCallEvent: '${event}' detected`, data);
      setEventData(data);

      if (onEventRef.current) {
        onEventRef.current(data);
      }

      // Auto-clear event data after a short delay unless persistent
      if (!persistent && autoReset) {
        const timer = setTimeout(() => {
          setEventData(undefined);
        }, 100);

        return () => clearTimeout(timer);
      }
    }

    return undefined;
  }, [event, incomingCall, sessionStatus, sessionId, eventData, persistent, autoReset, previousStatus]);

  // Clear on mount
  useEffect(() => {
    if (autoReset) {
      setEventData(undefined);
    }
  }, [autoReset]);

  return {
    data: eventData,
    clear,
  };
}
