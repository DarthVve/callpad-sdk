import type { Socket } from "socket.io-client";
import type { AuthManager } from "../auth.manager";
import type { Nullable } from "../types";
import { ConnectionManager } from "./connection.manager";
import { EventBus } from "./event.bus";
import type { SocketEvents } from "./types";
import type { ConnectionConfig } from "./types";

const SOCKET_EVENT_KEYS = [
  "call.incoming",
  "call.accepted",
  "call.declined",
  "call.ended",
  "call.join-info",
] as const satisfies ReadonlyArray<keyof SocketEvents>;

export class SocketManager {
  private static instance: Nullable<SocketManager> = null;

  readonly connection = new ConnectionManager();
  readonly events = new EventBus<SocketEvents>();
  private socket: Nullable<Socket> = null;

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  async initialize(
    baseUrl: string,
    authManager: AuthManager,
    config: ConnectionConfig = {}
  ): Promise<void> {
    this.socket = await this.connection.connect(baseUrl, authManager, config);

    this.bridgeSocketEvents();
  }

  private bridgeSocketEvents(): void {
    if (!this.socket) {
      return;
    }

    for (const eventName of SOCKET_EVENT_KEYS) {
      this.socket.on(eventName, (data: any) => {
        this.events.emit(eventName, data);
      });
    }
  }

  emit<K extends keyof SocketEvents & string>(
    event: K,
    data: SocketEvents[K]
  ): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`SocketManager: Cannot emit ${event} - not connected`);
    }
  }

  destroy(): void {
    this.events.destroy();
    this.connection.destroy();
    this.socket = null;
    SocketManager.instance = null;
    console.log("SocketManager: Destroyed and cleaned up");
  }
}
