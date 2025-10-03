import { type Socket, io } from "socket.io-client";
import type { AuthManager } from "../auth.manager";
import type { Nullable } from "../types";
import type {
  ConnectionConfig,
  ConnectionEvents,
  ConnectionState,
} from "./connection.types";
import { EventBus } from "./event.bus";
import type { SocketEvents } from "./events";

export class SocketManager {
  private static instance: Nullable<SocketManager> = null;

  private socket: Nullable<Socket> = null;
  private connectionState: ConnectionState = "DISCONNECTED";
  readonly events = new EventBus<SocketEvents & ConnectionEvents>();

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
    if (this.socket?.connected) {
      return;
    }

    this.updateConnectionState("CONNECTING");
    const token = authManager.getCurrentToken();
    if (!token) {
      const error = new Error("No authentication token available");
      this.events.emit("connection.error", error);
      throw error;
    }

    try {
      this.socket = io(baseUrl, {
        auth: { token },
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: config.reconnectAttempts ?? 5,
        reconnectionDelay: config.reconnectDelay ?? 1000,
        reconnectionDelayMax: config.reconnectDelayMax ?? 30000,
        timeout: config.timeout ?? 10000,
        forceNew: true,
        path: "/signal/socket.io",
      });

      this.setupConnectionHandlers(authManager);
      this.setupSocketEventBridging();
      this.socket.connect();
    } catch (error) {
      this.updateConnectionState("ERROR");
      this.events.emit("connection.error", error as Error);
      throw error;
    }
  }

  private setupConnectionHandlers(authManager: AuthManager): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.updateConnectionState("CONNECTED");
      console.log("SocketManager: Connected to server");
    });

    this.socket.on("disconnect", (reason: string) => {
      this.updateConnectionState("DISCONNECTED");
      console.log("SocketManager: Disconnected:", reason);
    });

    this.socket.on("connect_error", (error: Error) => {
      this.updateConnectionState("ERROR");
      console.error("SocketManager: Connection error:", error.message);
      this.events.emit("connection.error", error);
    });

    this.socket.io.on("reconnect_attempt", () => {
      this.updateConnectionState("RECONNECTING");
      const freshToken = authManager.getCurrentToken();
      if (freshToken && this.socket) {
        console.log("SocketManager: Refreshing auth token for reconnection");
        this.socket.auth = { token: freshToken };
      }
    });

    this.socket.io.on("reconnect", (attemptNumber: number) => {
      console.log(`SocketManager: Reconnected after ${attemptNumber} attempts`);
    });

    this.socket.io.on("reconnect_error", (error: Error) => {
      console.error("SocketManager: Reconnection error:", error.message);
      if (this.isAuthError(error)) {
        this.updateConnectionState("FAILED");
      }
    });

    this.socket.io.on("reconnect_failed", () => {
      this.updateConnectionState("FAILED");
      console.error("SocketManager: All reconnection attempts failed");
    });
  }

  private setupSocketEventBridging(): void {
    if (!this.socket) return;

    // Bridge call-related events to our event bus
    const callEvents = [
      "call.incoming",
      "call.accepted",
      "call.declined",
      "call.ended",
      "call.join-info",
    ];

    for (const eventName of callEvents) {
      this.socket.on(eventName, (data: any) => {
        this.events.emit(eventName as keyof SocketEvents, data);
      });
    }
  }

  private isAuthError(error: Error): boolean {
    const authErrorIndicators = [
      "unauthorized",
      "authentication",
      "token",
      "401",
      "403",
    ];
    const errorMessage = error.message.toLowerCase();
    return authErrorIndicators.some((indicator) =>
      errorMessage.includes(indicator)
    );
  }

  private updateConnectionState(newState: ConnectionState): void {
    if (this.connectionState !== newState) {
      const previousState = this.connectionState;
      this.connectionState = newState;
      this.events.emit("connection.state", {
        state: newState,
        previousState,
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

  // Connection state methods
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return (
      this.connectionState === "CONNECTED" && this.socket?.connected === true
    );
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.updateConnectionState("DISCONNECTED");
  }

  destroy(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.events.destroy();
    this.connectionState = "DISCONNECTED";
    SocketManager.instance = null;
    console.log("SocketManager: Destroyed and cleaned up");
  }
}
