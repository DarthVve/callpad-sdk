import { type Socket, io } from "socket.io-client";
import type { AuthManager } from "../auth.manager";
import type { Nullable } from "../types";
import { SocketHandlerRegistry } from "./handlers";
import type { ConnectionConfig, ConnectionState } from "./types";

export class SocketManager {
  private static instance: Nullable<SocketManager> = null;

  private socket: Nullable<Socket> = null;
  private connectionState: ConnectionState = "DISCONNECTED";
  private livekit: any = null;
  private handlerRegistry: Nullable<SocketHandlerRegistry> = null;

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
    config: ConnectionConfig = {},
    livekit?: any
  ): Promise<void> {
    this.livekit = livekit;
    if (this.socket?.connected) {
      return;
    }

    this.updateConnectionState("CONNECTING");
    const token = authManager.getCurrentToken();
    if (!token) {
      throw new Error("No authentication token available");
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
        transports: ["websocket"],
        withCredentials: false,
      });

      this.setupConnectionHandlers(authManager);
      this.setupEventHandlers();
      this.socket.connect();
    } catch (error) {
      this.updateConnectionState("ERROR");
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

  private setupEventHandlers(): void {
    if (!this.socket) {
      return;
    }

    console.log("🔗 SocketManager: Setting up event handlers via registry");

    this.handlerRegistry = new SocketHandlerRegistry({
      log: (level, message, extra) => {
        console.log(`[${level.toUpperCase()}] ${message}`, extra);
      },
      livekit: this.livekit,
    });

    this.handlerRegistry.registerEventListeners(this.socket);
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
      this.connectionState = newState;
      console.log(`SocketManager: Connection state changed to ${newState}`);
    }
  }

  destroy(): void {
    if (this.socket) {
      if (this.handlerRegistry) {
        this.handlerRegistry.removeEventListeners(this.socket);
        this.handlerRegistry.destroy();
        this.handlerRegistry = null;
      }
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionState = "DISCONNECTED";
    SocketManager.instance = null;
    console.log("SocketManager: Destroyed and cleaned up");
  }
}
