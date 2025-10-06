/**
 * SDK Event Bus Implementation
 *
 * Provides a centralized event system for internal SDK communication.
 * Supports type-safe event subscription, filtering, and debugging.
 */

import { createLogger } from "../../utils/logger";
import type {
  EventFilter,
  EventHandler,
  EventSubscription,
  SdkEvent,
  SdkEventType,
} from "./types";

const logger = createLogger("core:event-bus");

export class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();
  private isDebugMode = false;
  private eventHistory: SdkEvent[] = [];
  private maxHistorySize = 100;

  constructor(debugMode = false) {
    this.isDebugMode = debugMode;
  }

  /**
   * Subscribe to events of a specific type
   */
  on<T = any>(
    eventType: string | SdkEventType,
    handler: EventHandler<T>,
    filter?: EventFilter<T>
  ): EventSubscription {
    const actualHandler = filter
      ? (event: SdkEvent<T>) => {
          if (filter(event)) {
            handler(event);
          }
        }
      : handler;

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)?.add(actualHandler);

    if (this.isDebugMode) {
      logger.debug(`Event listener added for: ${eventType}`, {
        eventType,
        totalListeners: this.listeners.get(eventType)?.size,
      });
    }

    return {
      unsubscribe: () => {
        const handlers = this.listeners.get(eventType);
        if (handlers) {
          handlers.delete(actualHandler);
          if (handlers.size === 0) {
            this.listeners.delete(eventType);
          }
        }

        if (this.isDebugMode) {
          logger.debug(`Event listener removed for: ${eventType}`, {
            eventType,
            remainingListeners: handlers?.size || 0,
          });
        }
      },
    };
  }

  /**
   * Subscribe to events matching a pattern (e.g., "call:*")
   */
  onPattern<T = any>(
    pattern: string,
    handler: EventHandler<T>,
    filter?: EventFilter<T>
  ): EventSubscription {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    const patternHandler: EventHandler<T> = (event: SdkEvent<T>) => {
      if (regex.test(event.type)) {
        if (filter && !filter(event)) return;
        handler(event);
      }
    };

    // Store pattern handlers separately to avoid conflicts
    const patternKey = `__pattern__${pattern}`;
    if (!this.listeners.has(patternKey)) {
      this.listeners.set(patternKey, new Set());
    }

    this.listeners.get(patternKey)?.add(patternHandler);

    if (this.isDebugMode) {
      logger.debug(`Pattern listener added: ${pattern}`, { pattern });
    }

    return {
      unsubscribe: () => {
        const handlers = this.listeners.get(patternKey);
        if (handlers) {
          handlers.delete(patternHandler);
          if (handlers.size === 0) {
            this.listeners.delete(patternKey);
          }
        }

        if (this.isDebugMode) {
          logger.debug(`Pattern listener removed: ${pattern}`, { pattern });
        }
      },
    };
  }

  /**
   * Subscribe to a single event occurrence
   */
  once<T = any>(
    eventType: string | SdkEventType,
    handler: EventHandler<T>,
    filter?: EventFilter<T>
  ): EventSubscription {
    const subscription = this.on(
      eventType,
      (event: SdkEvent<T>) => {
        handler(event);
        subscription.unsubscribe();
      },
      filter
    );

    return subscription;
  }

  /**
   * Emit an event
   */
  emit<T = any>(
    eventType: string | SdkEventType,
    payload: T,
    source: "socket" | "livekit" | "user" = "user"
  ): void {
    const event: SdkEvent<T> = {
      type: eventType.toString(),
      payload,
      timestamp: Date.now(),
      source,
    };

    // Add to history for debugging
    this.addToHistory(event);

    if (this.isDebugMode) {
      logger.debug(`Event emitted: ${eventType}`, {
        eventType,
        payload,
        source,
        timestamp: event.timestamp,
      });
    }

    // Emit to exact type listeners
    const exactListeners = this.listeners.get(eventType.toString());
    if (exactListeners) {
      for (const handler of exactListeners) {
        try {
          handler(event);
        } catch (error) {
          logger.error(`Error in event handler for ${eventType}`, {
            error,
            eventType,
            payload,
          });
        }
      }
    }

    // Emit to pattern listeners
    this.listeners.forEach((handlers, key) => {
      if (key.startsWith("__pattern__")) {
        for (const handler of handlers) {
          try {
            handler(event);
          } catch (error) {
            logger.error(`Error in pattern handler for ${eventType}`, {
              error,
              eventType,
              pattern: key,
              payload,
            });
          }
        }
      }
    });
  }

  /**
   * Remove all listeners for a specific event type
   */
  off(eventType: string | SdkEventType): void {
    this.listeners.delete(eventType.toString());

    if (this.isDebugMode) {
      logger.debug(`All listeners removed for: ${eventType}`, { eventType });
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    const totalListeners = Array.from(this.listeners.values()).reduce(
      (sum, handlers) => sum + handlers.size,
      0
    );

    this.listeners.clear();

    if (this.isDebugMode) {
      logger.debug("All listeners removed", { removedCount: totalListeners });
    }
  }

  /**
   * Get the count of listeners for an event type
   */
  listenerCount(eventType: string | SdkEventType): number {
    return this.listeners.get(eventType.toString())?.size || 0;
  }

  /**
   * Get all event types that have listeners
   */
  getEventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Enable or disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
    logger.debug(`Debug mode ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Get event history for debugging
   */
  getEventHistory(): SdkEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
    if (this.isDebugMode) {
      logger.debug("Event history cleared");
    }
  }

  /**
   * Get events matching a filter
   */
  getEventsWhere(filter: EventFilter): SdkEvent[] {
    return this.eventHistory.filter(filter);
  }

  private addToHistory(event: SdkEvent): void {
    this.eventHistory.push(event);

    // Keep history size manageable
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Set maximum history size
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;

    // Trim existing history if needed
    if (this.eventHistory.length > size) {
      this.eventHistory = this.eventHistory.slice(-size);
    }
  }
}

// Global event bus instance
export const eventBus = new EventBus(false);
