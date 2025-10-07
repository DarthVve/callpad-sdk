import { useEffect, useRef, useState } from "react";
import { eventBus } from "../core/events";
import type { EventFilter, EventHandler, SdkEvent, SdkEventType } from "../core/events";

export function useEvent<T = any>(
  eventType: string | SdkEventType,
  callback?: EventHandler<T> | null,
  filter?: EventFilter<T>
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

    // Support pattern matching (e.g., "call:*")
    const subscription = eventType.includes("*")
      ? eventBus.onPattern(eventType, handler, filter)
      : eventBus.on(eventType, handler, filter);

    return () => {
      subscription.unsubscribe();
    };
  }, [eventType, filter]);

  return lastEvent;
}
