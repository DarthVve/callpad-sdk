import { InitService, OpenAPI } from "../generated/api";
import { createLogger } from "../utils/logger";
import { SessionStorage } from "./session-storage";
import type { AuthProvider, Nullable, SessionInfo } from "./types";

const logger = createLogger("auth-manager");

export class AuthManager {
  private readonly authProvider: AuthProvider;
  private lastToken: Nullable<string> = null;
  private readonly sessionStorage: SessionStorage<SessionInfo>;
  private readonly appId: string;
  private initializePromise: Nullable<Promise<void>> = null;

  constructor(authProvider: AuthProvider, appId: string) {
    this.authProvider = authProvider;
    this.appId = appId;
    this.sessionStorage = new SessionStorage<SessionInfo>(
      "callpad_session_info"
    );
  }

  async initialize(appId: string): Promise<void> {
    try {
      const token = this.authProvider();
      if (!token) {
        throw new Error("No authentication token available for initialization");
      }

      // Temporarily configure OpenAPI to use GetToken for the init call only
      // This prevents circular dependency (init call → session token → init call)
      const originalToken = OpenAPI.TOKEN;
      OpenAPI.TOKEN = token;

      try {
        logger.debug("Initializing session", { appId });
        const response = await InitService.getSignalInit({ appId });

        const sessionInfo: SessionInfo = {
          sessionToken: response.sessionToken,
          sessionId: response.sessionId,
          userId: response.userId,
          deviceId: response.deviceId,
          expiresAt: response.expiresAt,
        };

        this.sessionStorage.set(sessionInfo);
        logger.info("Session initialized successfully", {
          sessionId: sessionInfo.sessionId,
          userId: sessionInfo.userId,
        });
      } finally {
        // Restore original OpenAPI.TOKEN configuration
        OpenAPI.TOKEN = originalToken;
      }
    } catch (error) {
      logger.error("Failed to initialize session", { appId, error });
      throw new Error(`Session initialization failed: ${error}`);
    }
  }

  async getSessionToken(): Promise<string | null> {
    // Check if session already exists
    const sessionInfo = this.sessionStorage.get();
    if (sessionInfo) {
      return sessionInfo.sessionToken;
    }

    // If no session exists and no initialization is in progress, start initialization
    if (!this.initializePromise) {
      this.initializePromise = this.initialize(this.appId);
    }

    // Wait for initialization to complete
    try {
      await this.initializePromise;
      const newSessionInfo = this.sessionStorage.get();
      return newSessionInfo?.sessionToken || null;
    } catch (error) {
      logger.error("Failed to get session token", { error });
      return null;
    }
  }

  getSessionInfo(): SessionInfo | null {
    return this.sessionStorage.get();
  }

  getCurrentToken(): string | null {
    const token = this.authProvider();
    if (token !== this.lastToken) {
      this.lastToken = token;
    }

    return token;
  }
}
