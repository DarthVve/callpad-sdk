import type { EventCallback, UnsubscribeFn } from "./types";

export class EventBus<
  TEvents extends Record<string, any> = Record<string, any>,
> {
  private eventTarget = new EventTarget();
  private handlerMap = new Map<EventCallback<any>, EventListener>();

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
    this.handlerMap.set(handler, wrappedHandler);

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
    this.handlerMap.set(handler, wrappedHandler);

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
    const wrappedHandler = this.handlerMap.get(handler);
    if (wrappedHandler) {
      this.eventTarget.removeEventListener(event, wrappedHandler);
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
      const handlersToRemove: EventCallback<any>[] = [];
      for (const [handler] of this.handlerMap) {
        handlersToRemove.push(handler);
      }
      for (const handler of handlersToRemove) {
        this.off(event, handler);
      }
    } else {
      for (const [handler, wrappedHandler] of this.handlerMap) {
        this.handlerMap.delete(handler);
      }
      this.handlerMap.clear();
    }
  }

  listenerCount(event: keyof TEvents & string): number {
    let count = 0;
    for (const [, wrappedHandler] of this.handlerMap) {
      count++;
    }
    return count;
  }

  destroy(): void {
    this.removeAllListeners();
  }
}
