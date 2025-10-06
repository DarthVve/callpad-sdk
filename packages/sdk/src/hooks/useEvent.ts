import { useEffect, useRef, useState } from "react";
import { eventBus } from "../core/events";
import { SdkEventType } from "../core/events/types";
import type { EventFilter, EventHandler, SdkEvent } from "../core/events/types";

/**
 * Hook for subscribing to SDK events
 *
 * @example
 * // Listen for specific event type
 * const callEvent = useEvent(SdkEventType.CALL_ACCEPTED);
 *
 * @example
 * // Listen with callback
 * useEvent(SdkEventType.MEDIA_ENABLED, (event) => {
 *   // Handle media enabled event
 * });
 *
 * @example
 * // Listen to pattern with filter
 * useEvent('call:*', null, (event) => event.payload.callId === 'specific-call');
 */
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

/**
 * Hook for subscribing to events once
 *
 * @example
 * useEventOnce(SdkEventType.CALL_ACCEPTED, (event) => {
 *   // Handle call accepted event once
 * });
 */
export function useEventOnce<T = any>(
  eventType: string | SdkEventType,
  callback: EventHandler<T>,
  filter?: EventFilter<T>
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const subscription = eventBus.once(eventType, callbackRef.current, filter);

    return () => {
      subscription.unsubscribe();
    };
  }, [eventType, filter]);
}

/**
 * Hook for accessing the event bus directly
 * Use this for advanced event management scenarios
 *
 * @example
 * const events = useEventBus();
 *
 * // Emit custom event
 * events.emit('custom:event', { data: 'test' });
 *
 * // Get event history
 * const history = events.getEventHistory();
 */
export function useEventBus() {
  return eventBus;
}

/**
 * Hook for getting events matching a condition
 *
 * @example
 * const callEvents = useEventHistory((event) =>
 *   event.type.startsWith('call:') &&
 *   event.payload.callId === currentCallId
 * );
 */
export function useEventHistory<T = any>(
  filter?: EventFilter<T>
): SdkEvent<T>[] {
  const [events, setEvents] = useState<SdkEvent<T>[]>(() =>
    filter ? eventBus.getEventsWhere(filter) : eventBus.getEventHistory()
  );

  useEffect(() => {
    const updateEvents = () => {
      const newEvents = filter
        ? eventBus.getEventsWhere(filter)
        : eventBus.getEventHistory();
      setEvents(newEvents);
    };

    // Subscribe to any event to trigger updates
    const subscription = eventBus.onPattern("*", updateEvents);

    return () => {
      subscription.unsubscribe();
    };
  }, [filter]);

  return events;
}

/**
 * Hook for consuming call-specific events
 * Automatically filters events by call ID
 *
 * @example
 * const { callAccepted, callDeclined, participantJoined } = useCallEvents(callId);
 */
export function useCallEvents(callId?: string) {
  const callFilter: EventFilter = (event) =>
    !callId || event.payload?.callId === callId;

  const callAccepted = useEvent(SdkEventType.CALL_ACCEPTED, null, callFilter);
  const callDeclined = useEvent(SdkEventType.CALL_DECLINED, null, callFilter);
  const callEnded = useEvent(SdkEventType.CALL_ENDED, null, callFilter);
  const participantJoined = useEvent(
    SdkEventType.PARTICIPANT_JOINED,
    null,
    callFilter
  );
  const participantLeft = useEvent(
    SdkEventType.PARTICIPANT_LEFT,
    null,
    callFilter
  );

  return {
    callAccepted,
    callDeclined,
    callEnded,
    participantJoined,
    participantLeft,
  };
}

/**
 * Hook for consuming media events
 * Automatically filters events by participant ID
 *
 * @example
 * const { mediaEnabled, mediaDisabled } = useMediaEvents(participantId);
 */
export function useMediaEvents(participantId?: string) {
  const mediaFilter: EventFilter = (event) =>
    !participantId || event.payload?.participantId === participantId;

  const mediaEnabled = useEvent(SdkEventType.MEDIA_ENABLED, null, mediaFilter);
  const mediaDisabled = useEvent(
    SdkEventType.MEDIA_DISABLED,
    null,
    mediaFilter
  );

  return {
    mediaEnabled,
    mediaDisabled,
  };
}
