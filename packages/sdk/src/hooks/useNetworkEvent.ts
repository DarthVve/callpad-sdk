import { useEffect, useRef, useState } from "react";
import type { SocketEvents } from "../core/socketio/types";
import { useSdk } from "../provider/RtcProvider";

/**
 * Hook to listen for network events from the socket connection.
 * Provides two usage patterns:
 * 1. Callback-based: useNetworkEvent('call.incoming', (data) => { ... })
 * 2. Return-based: const event = useNetworkEvent('call.incoming')
 *
 * @param event - The network event to listen for
 * @param handler - Optional callback handler for the event
 * @returns The latest event data (when no handler is provided)
 */
export function useNetworkEvent<K extends keyof SocketEvents>(
  event: K,
  handler?: (data: SocketEvents[K]) => void
): SocketEvents[K] | undefined {
  const sdk = useSdk();
  const [eventData, setEventData] = useState<SocketEvents[K] | undefined>(
    undefined
  );

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const eventHandler = (data: SocketEvents[K]) => {
      setEventData(data);
      if (handlerRef.current) {
        handlerRef.current(data);
      }
    };

    const unsubscribe = sdk.socket.events.on(event, eventHandler);
    return () => {
      unsubscribe();
    };
  }, [sdk, event]);

  useEffect(() => {
    setEventData(undefined);
  }, [event]);

  return eventData;
}
