import type { Socket } from "socket.io-client";
import { createLogger } from "../../../utils/logger";
import type { SocketHandlerOptions } from "./base.handler";
import { SessionCancelledHandler } from "./call-cancelled.handler";
import { SessionCreatedHandler } from "./call-created.handler";
import { SessionEndedHandler } from "./call-ended.handler";
import { SessionMissedHandler } from "./call-missed.handler";
import { InviteAcceptedHandler } from "./invite-accepted.handler";
import { InviteCancelledHandler } from "./invite-cancelled.handler";
import { InviteDeclinedHandler } from "./invite-declined.handler";
import { InviteMissedHandler } from "./invite-missed.handler";
import { InviteSentHandler } from "./invite-sent.handler";
import { InviteHandler } from "./invite.handler";
import { JoinInfoHandler } from "./join-info.handler";
import { ParticipantAddedHandler } from "./participant-added.handler";
import { RoomStartedHandler } from "./room-started.handler";

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
      // Phase 1: Core flow handlers
      new InviteHandler(this.options),
      new JoinInfoHandler(this.options),
      new SessionEndedHandler(this.options),
      new SessionCreatedHandler(this.options),

      // Phase 2: Invite management handlers
      new InviteAcceptedHandler(this.options),
      new InviteDeclinedHandler(this.options),
      new InviteCancelledHandler(this.options),
      new InviteSentHandler(this.options),

      // Phase 3: Edge case handlers
      new InviteMissedHandler(this.options),
      new SessionCancelledHandler(this.options),
      new SessionMissedHandler(this.options),
      new ParticipantAddedHandler(this.options),

      // Phase 4: LiveKit room events
      new RoomStartedHandler(this.options),
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
