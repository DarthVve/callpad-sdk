import mitt, { type Emitter } from "mitt";
import type { EventHandler, EventSubscription, SdkEvent, SdkEventType } from "./types";

type Events = Record<string, any>;

class EventBus {
  private emitter: Emitter<Events>;

  constructor() {
    this.emitter = mitt<Events>();
  }

  on<T = any>(
    eventType: string | SdkEventType,
    handler: EventHandler<T>
  ): EventSubscription {
    const wrappedHandler = (event: SdkEvent<T>) => {
      handler(event);
    };

    this.emitter.on(eventType.toString(), wrappedHandler);

    return {
      unsubscribe: () => {
        this.emitter.off(eventType.toString(), wrappedHandler);
      },
    };
  }

  emit<T = any>(eventType: string | SdkEventType, payload: T): void {
    const event: SdkEvent<T> = {
      type: eventType.toString(),
      payload,
      timestamp: Date.now(),
    };

    this.emitter.emit(eventType.toString(), event);
  }

  off(eventType: string | SdkEventType): void {
    this.emitter.off(eventType.toString());
  }

  removeAllListeners(): void {
    this.emitter.all.clear();
  }
}

export const eventBus = new EventBus();
export { EventBus };
