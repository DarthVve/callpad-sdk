import type { Socket } from "socket.io-client";
import { createLogger } from "../../../utils/logger";
import type { SocketHandlerOptions } from "./base.handler";
import { SessionEndedHandler } from "./call-ended.handler";
import { CallParticipantKickedHandler } from "./call-participant-kicked.handler";
import { CallReadyHandler } from "./call-ready.handler";
import { CallStartedHandler } from "./call-started.handler";
import { InviteAcceptedHandler } from "./invite-accepted.handler";
import { InviteCancelledHandler } from "./invite-cancelled.handler";
import { InviteDeclinedHandler } from "./invite-declined.handler";
import { InviteHandler } from "./invite.handler";
import { ParticipantAddedHandler } from "./participant-added.handler";
import { ParticipantProfilesHandler } from "./participant-profiles.handler";

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
      // Core call flow
      new InviteHandler(this.options),
      new CallReadyHandler(this.options),
      new CallStartedHandler(this.options),
      new SessionEndedHandler(this.options),

      // Invite lifecycle
      new InviteAcceptedHandler(this.options),
      new InviteDeclinedHandler(this.options),
      new InviteCancelledHandler(this.options),

      // Participant management
      new ParticipantAddedHandler(this.options),
      new CallParticipantKickedHandler(this.options),

      // Profile hydration
      new ParticipantProfilesHandler(this.options),
    ];

    for (const handler of handlers) {
      this.handlers.set((handler as any).eventName, handler);
    }

    logger.info(`Registered ${handlers.length} socket event handlers`);
  }

  registerEventListeners(socket: Socket): void {
    for (const [eventName, handler] of this.handlers) {
      socket.on(eventName, (rawData: any) => {
        handler.handleRaw(rawData).catch((error: Error) => {
          logger.error(`Handler error for ${eventName}:`, error);
        });
      });
    }
    logger.debug("Event listeners registered on socket");
  }

  removeEventListeners(socket: Socket): void {
    for (const eventName of this.handlers.keys()) {
      socket.off(eventName);
    }
    logger.debug("Event listeners removed from socket");
  }

  destroy(): void {
    this.handlers.clear();
    logger.debug("Handler registry destroyed");
  }

  /**
   * Get all registered event names
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.handlers.keys());
  }
}
