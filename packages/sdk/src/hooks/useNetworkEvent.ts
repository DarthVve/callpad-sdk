import { useEffect, useRef, useState } from "react";
import type { SocketEvents } from "../core/socketio/types";
import { useSdk } from "../provider/RtcProvider";


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
  }, []);

  return eventData;
}
