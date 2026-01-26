import { InitService, OpenAPI } from "../generated/api";
import { createLogger } from "../utils/logger";
import { SessionStorage } from "./session-storage";
import type {
  AuthProvider,
  AuthRetryConfig,
  Nullable,
  SessionInfo,
} from "./types";

const logger = createLogger("auth-manager");

const DEFAULT_AUTH_RETRY_CONFIG: AuthRetryConfig = {
  maxRetries: 10,
  initialDelayMs: 200,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

export class AuthManager {
  private readonly authProvider: AuthProvider;
  private lastToken: Nullable<string> = null;
  private readonly sessionStorage: SessionStorage<SessionInfo>;
  private readonly appId: string;
  private initializePromise: Nullable<Promise<void>> = null;
  private readonly retryConfig: AuthRetryConfig;

  constructor(
    authProvider: AuthProvider,
    appId: string,
    retryConfig?: Partial<AuthRetryConfig>
  ) {
    this.authProvider = authProvider;
    this.appId = appId;
    this.sessionStorage = new SessionStorage<SessionInfo>(
      "callpad_session_info"
    );
    this.retryConfig = { ...DEFAULT_AUTH_RETRY_CONFIG, ...retryConfig };
  }

  private async acquireTokenWithRetry(): Promise<string> {
    const { maxRetries, initialDelayMs, maxDelayMs, backoffMultiplier } =
      this.retryConfig;

    let delay = initialDelayMs;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const token = this.authProvider();
      if (token) {
        if (attempt > 0) {
          logger.debug("Token acquired after retry", { attempt });
        }
        return token;
      }

      if (attempt < maxRetries) {
        logger.debug("Auth token not available, retrying", {
          attempt: attempt + 1,
          maxRetries,
          delayMs: delay,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelayMs);
      }
    }

    throw new Error(
      `No authentication token available after ${maxRetries} retries. This may indicate the auth provider is temporarily unavailable (e.g., token refresh in progress).`
    );
  }

  async initialize(appId: string): Promise<void> {
    try {
      const token = await this.acquireTokenWithRetry();

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
