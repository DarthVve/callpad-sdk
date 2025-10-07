import type { Socket } from "socket.io-client";
import { createLogger } from "../../../utils/logger";
import type { SocketHandlerOptions } from "./base.handler";
import { CallParticipantAcceptedHandler } from "./call-accepted.handler";
import { CallCanceledHandler } from "./call-canceled.handler";
import { CallParticipantDeclinedHandler } from "./call-declined.handler";
import { CallEndedHandler } from "./call-ended.handler";
import { CallIncomingHandler } from "./call-incoming.handler";
import { CallJoinInfoHandler } from "./call-join-info.handler";
import { CallTimeoutHandler } from "./call-timeout.handler";

const logger = createLogger("socketio:registry");

export class SocketHandlerRegistry {
  private handlers = new Map<string, any>();

  constructor(private options: SocketHandlerOptions = {}) {
    this.initializeHandlers();
  }

  private initializeHandlers(): void {
    const handlers = [
      new CallIncomingHandler(this.options),
      new CallParticipantAcceptedHandler(this.options),
      new CallParticipantDeclinedHandler(this.options),
      new CallEndedHandler(this.options),
      new CallJoinInfoHandler(this.options),
      new CallTimeoutHandler(this.options),
      new CallCanceledHandler(this.options),
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
}
