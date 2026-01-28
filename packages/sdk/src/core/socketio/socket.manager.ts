import { type Socket, io } from "socket.io-client";
import type { PresenceServiceInstance } from "../../services/presence.service";
import { createLogger } from "../../utils/logger";
import type { AuthManager } from "../auth.manager";
import type { Nullable } from "../types";
import { SocketHandlerRegistry } from "./handlers";
import type { SocketHandlerOptions } from "./handlers/base.handler";
import type { ConnectionConfig, ConnectionState } from "./types";

export class SocketManager {
  private static instance: Nullable<SocketManager> = null;
  private logger = createLogger("socket");

  private socket: Nullable<Socket> = null;
  private connectionState: ConnectionState = "DISCONNECTED";
  private livekit: any = null;
  private handlerRegistry: Nullable<SocketHandlerRegistry> = null;
  private authManager: Nullable<AuthManager> = null;
  private presenceService: Nullable<PresenceServiceInstance> = null;

  private constructor() {}

  setPresenceService(presenceService: PresenceServiceInstance): void {
    this.presenceService = presenceService;
  }

  getSocket(): Nullable<Socket> {
    return this.socket;
  }

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
    this.authManager = authManager;
    if (this.socket?.connected) {
      return;
    }

    this.updateConnectionState("CONNECTING");
    const token = await authManager.getSessionToken();
    if (!token) {
      throw new Error("No session token available");
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

  async initializeWithToken(
    baseUrl: string,
    sessionToken: string,
    config: ConnectionConfig = {}
  ): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    this.updateConnectionState("CONNECTING");

    try {
      this.socket = io(baseUrl, {
        auth: { token: sessionToken },
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

      this.setupGuestConnectionHandlers(sessionToken);
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
      this.logger.info("Connected to server");

      if (this.presenceService) {
        this.presenceService.startPing();
      }
    });

    this.socket.on("disconnect", (reason: string) => {
      this.updateConnectionState("DISCONNECTED");
      this.logger.info("Disconnected", { reason });

      if (this.presenceService) {
        this.presenceService.stopPing();
      }
    });

    this.socket.on("connect_error", (error: Error) => {
      this.updateConnectionState("ERROR");
      this.logger.error("Connection error", { error: error.message });
    });

    this.socket.io.on("reconnect_attempt", async () => {
      this.updateConnectionState("RECONNECTING");
      const freshToken = await authManager.getSessionToken();
      if (freshToken && this.socket) {
        this.logger.debug("Refreshing session token for reconnection");
        this.socket.auth = { token: freshToken };
      }
    });

    this.socket.io.on("reconnect", (attemptNumber: number) => {
      this.logger.info("Reconnected successfully", { attemptNumber });

      if (this.presenceService) {
        this.presenceService.startPing();
      }
    });

    this.socket.io.on("reconnect_error", (error: Error) => {
      this.logger.error("Reconnection error", { error: error.message });
      if (this.isAuthError(error)) {
        this.updateConnectionState("FAILED");
      }
    });

    this.socket.io.on("reconnect_failed", () => {
      this.updateConnectionState("FAILED");
      this.logger.error("All reconnection attempts failed");
    });
  }

  private setupGuestConnectionHandlers(sessionToken: string): void {
    if (!this.socket) {
      return;
    }

    this.socket.on("connect", () => {
      this.updateConnectionState("CONNECTED");
      this.logger.info("Guest connected to server");

      if (this.presenceService) {
        this.presenceService.startPing();
      }
    });

    this.socket.on("disconnect", (reason: string) => {
      this.updateConnectionState("DISCONNECTED");
      this.logger.info("Guest disconnected", { reason });

      if (this.presenceService) {
        this.presenceService.stopPing();
      }
    });

    this.socket.on("connect_error", (error: Error) => {
      this.updateConnectionState("ERROR");
      this.logger.error("Guest connection error", { error: error.message });
    });

    this.socket.io.on("reconnect_attempt", () => {
      this.updateConnectionState("RECONNECTING");
      if (this.socket) {
        this.logger.debug(
          "Reusing stored session token for guest reconnection"
        );
        this.socket.auth = { token: sessionToken };
      }
    });

    this.socket.io.on("reconnect", (attemptNumber: number) => {
      this.logger.info("Guest reconnected successfully", { attemptNumber });

      if (this.presenceService) {
        this.presenceService.startPing();
      }
    });

    this.socket.io.on("reconnect_error", (error: Error) => {
      this.logger.error("Guest reconnection error", { error: error.message });
      if (this.isAuthError(error)) {
        this.updateConnectionState("FAILED");
      }
    });

    this.socket.io.on("reconnect_failed", () => {
      this.updateConnectionState("FAILED");
      this.logger.error("All guest reconnection attempts failed");
    });
  }

  private setupEventHandlers(): void {
    if (!this.socket) {
      return;
    }

    this.logger.debug("Setting up event handlers via registry");

    console.log("[SOCKET_MANAGER] Setting up event handlers", {
      socketId: this.socket.id,
      connected: this.socket.connected,
    });

    // Clean up existing handlers to prevent duplicate registrations
    if (this.handlerRegistry) {
      this.handlerRegistry.removeEventListeners(this.socket);
      this.handlerRegistry.destroy();
    }

    const options: SocketHandlerOptions = {
      livekit: this.livekit,
    };

    if (this.authManager) {
      options.authManager = this.authManager;
    }

    this.handlerRegistry = new SocketHandlerRegistry(options);

    this.handlerRegistry.registerEventListeners(this.socket);

    console.log("[SOCKET_MANAGER] Event handlers registered successfully");
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
      this.logger.debug("Connection state changed", { newState });
    }
  }

  destroy(): void {
    if (this.presenceService) {
      this.presenceService.destroy();
      this.presenceService = null;
    }

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
    this.logger.debug("Destroyed and cleaned up");
  }
}
