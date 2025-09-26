import { type Socket, io } from "socket.io-client";
import type { AuthManager } from "../auth.manager";
import type { Nullable } from "../types";
import { EventBus } from "./event.bus";
import type { ConnectionState } from "./types";
import type { ConnectionConfig, ConnectionEvents } from "./types";

export class ConnectionManager {
  private socket: Nullable<Socket> = null;
  private connectionState: ConnectionState = "disconnected";
  private eventBus = new EventBus<ConnectionEvents>();

  async connect(
    baseUrl: string,
    authManager: AuthManager,
    config: ConnectionConfig = {}
  ): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.updateConnectionState("connecting");

    const token = authManager.getCurrentToken();
    if (!token) {
      const error = new Error("No authentication token available");
      this.eventBus.emit("connection.error", error);
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
      });

      this.setupConnectionHandlers(authManager);
      this.socket.connect();

      return this.socket;
    } catch (error) {
      this.updateConnectionState("error");
      this.eventBus.emit("connection.error", error as Error);
      throw error;
    }
  }

  private setupConnectionHandlers(authManager: AuthManager): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.updateConnectionState("connected");
      console.log("ConnectionManager: Connected to server");
    });

    this.socket.on("disconnect", (reason: string) => {
      this.updateConnectionState("disconnected");
      console.log("ConnectionManager: Disconnected:", reason);
    });

    this.socket.on("connect_error", (error: Error) => {
      this.updateConnectionState("error");
      console.error("ConnectionManager: Connection error:", error.message);
      this.eventBus.emit("connection.error", error);
    });

    this.socket.io.on("reconnect_attempt", () => {
      this.updateConnectionState("reconnecting");
      const freshToken = authManager.getCurrentToken();
      if (freshToken && this.socket) {
        console.log(
          "ConnectionManager: Refreshing auth token for reconnection"
        );
        this.socket.auth = { token: freshToken };
      }
    });

    this.socket.io.on("reconnect", (attemptNumber: number) => {
      console.log(
        `ConnectionManager: Reconnected after ${attemptNumber} attempts`
      );
    });

    this.socket.io.on("reconnect_error", (error: Error) => {
      console.error("ConnectionManager: Reconnection error:", error.message);
      if (this.isAuthError(error)) {
        this.updateConnectionState("failed");
      }
    });

    this.socket.io.on("reconnect_failed", () => {
      this.updateConnectionState("failed");
      console.error("ConnectionManager: All reconnection attempts failed");
    });
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
      this.eventBus.emit("connection.state", {
        state: newState,
        previousState,
      });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.updateConnectionState("disconnected");
  }

  getSocket(): Nullable<Socket> {
    return this.socket;
  }

  getState(): ConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return (
      this.connectionState === "connected" && this.socket?.connected === true
    );
  }

  onStateChange(
    handler: (data: {
      state: ConnectionState;
      previousState: ConnectionState;
    }) => void
  ): () => void {
    return this.eventBus.on("connection.state", handler);
  }

  onError(handler: (error: Error) => void): () => void {
    return this.eventBus.on("connection.error", handler);
  }

  destroy(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventBus.destroy();
    this.connectionState = "disconnected";
    console.log("ConnectionManager: Destroyed and cleaned up");
  }
}
