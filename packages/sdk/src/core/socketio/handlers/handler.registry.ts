import type { Socket } from "socket.io-client";
import { createLogger } from "../../../utils/logger";
import type { SocketHandlerOptions } from "./base.handler";

const logger = createLogger("socketio:registry");

/**
 * Registry for Socket.IO event handlers.
 * Automatically registers handlers with proper typing and error handling.
 */
export class SocketHandlerRegistry {
  private handlers = new Map<string, any>();

  constructor(private options: SocketHandlerOptions = {}) {
    this.initializeHandlers();
  }

  private initializeHandlers(): void {
    const handlers = [
      // TODO: Add new handlers here as they are implemented
      // Example:
      // new InviteHandler(this.options),
      // new InviteAcceptedHandler(this.options),
      // etc.
    ];

    for (const handler of handlers) {
      this.handlers.set((handler as any).eventName, handler);
    }
  }

  registerEventListeners(socket: Socket): void {
    for (const [eventName, handler] of this.handlers) {
      socket.on(eventName, (rawData: any) => {
        handler.handleRaw(rawData).catch((error: Error) => {
          logger.error(`Handler error for ${eventName}:`, error);
        });
      });
    }
  }

  removeEventListeners(socket: Socket): void {
    for (const eventName of this.handlers.keys()) {
      socket.off(eventName);
    }
  }

  destroy(): void {
    this.handlers.clear();
  }

  /**
   * Get all registered event names
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.handlers.keys());
  }
}