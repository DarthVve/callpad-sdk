import { useCallback, useEffect, useRef, useState } from "react";
import type { SocketEvents } from "../core/socketio/events";
import { useSdk } from "../provider/RtcProvider";

export interface CallEventOptions<K extends keyof SocketEvents> {
  onEvent?: (data: SocketEvents[K]) => void;
  persistent?: boolean;
  autoReset?: boolean;
}

export function useCallEvent<K extends keyof SocketEvents>(
  event: K,
  optionsOrCallback?: CallEventOptions<K> | ((data: SocketEvents[K]) => void)
): {
  data: SocketEvents[K] | undefined;
  clear: () => void;
} {
  const sdk = useSdk();
  const [eventData, setEventData] = useState<SocketEvents[K] | undefined>(
    undefined
  );

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

  useEffect(() => {
    const eventHandler = (data: SocketEvents[K]) => {
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

      return undefined;
    };

    const unsubscribe = sdk.socket.events.on(event, eventHandler);

    return () => {
      unsubscribe();
    };
  }, [sdk, event, persistent, autoReset]);

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
