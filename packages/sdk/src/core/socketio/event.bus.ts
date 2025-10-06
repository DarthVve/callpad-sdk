import type { EventCallback, UnsubscribeFn } from "./connection.types";

export class EventBus<
  TEvents extends Record<string, any> = Record<string, any>,
> {
  private eventTarget = new EventTarget();
  private handlerMap = new Map<
    EventCallback<any>,
    { listener: EventListener; event: string }
  >();

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   * @param event - The event name to listen for
   * @param handler - The callback function to handle the event data
   * @returns A function to unsubscribe from the event
   */
  on<K extends keyof TEvents>(
    event: K & string,
    handler: EventCallback<TEvents[K]>
  ): UnsubscribeFn {
    const wrappedHandler = ((e: CustomEvent) => {
      handler(e.detail);
    }) as EventListener;

    this.eventTarget.addEventListener(event, wrappedHandler);
    this.handlerMap.set(handler, { listener: wrappedHandler, event });

    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event that will only fire once, then automatically unsubscribe.
   * @param event - The event name to listen for
   * @param handler - The callback function to handle the event data
   * @returns A function to unsubscribe from the event (if needed before it fires)
   */
  once<K extends keyof TEvents>(
    event: K & string,
    handler: EventCallback<TEvents[K]>
  ): UnsubscribeFn {
    const wrappedHandler = ((e: CustomEvent) => {
      handler(e.detail);
      this.off(event, handler);
    }) as EventListener;

    this.eventTarget.addEventListener(event, wrappedHandler);
    this.handlerMap.set(handler, { listener: wrappedHandler, event });

    return () => this.off(event, handler);
  }

  /**
   * Unsubscribe from an event.
   * @param event - The event name to unsubscribe from
   * @param handler - The callback function to remove
   */
  off<K extends keyof TEvents>(
    event: K & string,
    handler: EventCallback<TEvents[K]>
  ): void {
    const handlerInfo = this.handlerMap.get(handler);
    if (handlerInfo) {
      this.eventTarget.removeEventListener(event, handlerInfo.listener);
      this.handlerMap.delete(handler);
    }
  }

  /**
   * Emit an event with data to all subscribers.
   * @param event - The event name to emit
   * @param data - The data to send with the event
   */
  emit<K extends keyof TEvents>(event: K & string, data: TEvents[K]): void {
    this.eventTarget.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  removeAllListeners(event?: keyof TEvents & string): void {
    if (event) {
      // Remove listeners for specific event
      const handlersToRemove: EventCallback<any>[] = [];
      for (const [handler, handlerInfo] of this.handlerMap) {
        if (handlerInfo.event === event) {
          handlersToRemove.push(handler);
        }
      }
      for (const handler of handlersToRemove) {
        this.off(event, handler);
      }
    } else {
      // Remove all listeners for all events
      for (const [handler, handlerInfo] of this.handlerMap) {
        this.eventTarget.removeEventListener(
          handlerInfo.event,
          handlerInfo.listener
        );
      }
      this.handlerMap.clear();
    }
  }

  listenerCount(event: keyof TEvents & string): number {
    let count = 0;
    for (const [, handlerInfo] of this.handlerMap) {
      if (handlerInfo.event === event) {
        count++;
      }
    }
    return count;
  }

  destroy(): void {
    this.removeAllListeners();
  }
}
