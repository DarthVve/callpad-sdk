import type { Socket } from "socket.io-client";
import type { SocketHandlerOptions } from "./base.handler";
import { CallAcceptedHandler } from "./call-accepted.handler";
import { CallDeclinedHandler } from "./call-declined.handler";
import { CallEndedHandler } from "./call-ended.handler";
import { CallIncomingHandler } from "./call-incoming.handler";
import { CallJoinInfoHandler } from "./call-join-info.handler";
import { ParticipantLeftHandler } from "./participant-left.handler";

export class SocketHandlerRegistry {
  private handlers = new Map<string, any>();

  constructor(private options: SocketHandlerOptions = {}) {
    this.initializeHandlers();
  }

  private initializeHandlers(): void {
    const handlers = [
      new CallIncomingHandler(this.options),
      new CallAcceptedHandler(this.options),
      new CallDeclinedHandler(this.options),
      new CallEndedHandler(this.options),
      new CallJoinInfoHandler(this.options),
      new ParticipantLeftHandler(this.options),
    ];

    for (const handler of handlers) {
      this.handlers.set((handler as any).eventName, handler);
    }
  }

  registerEventListeners(socket: Socket): void {
    for (const [eventName, handler] of this.handlers) {
      socket.on(eventName, (rawData: any) => {
        handler.handleRaw(rawData).catch((error: Error) => {
          console.error(`Handler error for ${eventName}:`, error);
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
