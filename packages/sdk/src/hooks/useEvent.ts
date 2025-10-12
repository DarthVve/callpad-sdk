import { useEffect, useRef, useState } from "react";
import { eventBus } from "../core/events";
import type { EventHandler, SdkEvent, SdkEventType } from "../core/events";

export function useEvent<T = any>(
  eventType: string | SdkEventType,
  callback?: EventHandler<T> | null
): SdkEvent<T> | undefined {
  const [lastEvent, setLastEvent] = useState<SdkEvent<T> | undefined>(
    undefined
  );
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler: EventHandler<T> = (event: SdkEvent<T>) => {
      setLastEvent(event);
      if (callbackRef.current) {
        callbackRef.current(event);
      }
    };

    const subscription = eventBus.on(eventType, handler);

    return () => {
      subscription.unsubscribe();
    };
  }, [eventType]);

  return lastEvent;
}
