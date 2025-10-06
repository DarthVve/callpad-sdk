import type { ZodSchema } from "zod";
import { pushSocketValidationError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import { createLogger } from "../../../utils/logger";
import type { CallpadLogger } from "../../../utils/logger";
import type { AutoJoinConfig } from "../../types";
import type { AuthManager } from "../../auth.manager";

export interface SocketHandlerOptions {
  livekit?: any;
  autoJoinConfig?: AutoJoinConfig | null;
  authManager?: AuthManager;
}

export abstract class BaseSocketHandler<T = any> {
  protected abstract readonly eventName: string;
  protected abstract readonly schema: ZodSchema<T>;
  private _logger?: CallpadLogger;

  constructor(protected readonly options: SocketHandlerOptions = {}) {}

  protected get logger(): CallpadLogger {
    if (!this._logger) {
      this._logger = createLogger(`socketio:${this.eventName}`);
    }
    return this._logger;
  }

  protected get authManager(): AuthManager | undefined {
    return this.options.authManager;
  }

  async handleRaw(rawData: unknown): Promise<void> {
    this.logger.info(`${this.eventName} received`, rawData);

    const result = this.schema.safeParse(rawData);
    if (!result.success) {
      this.logger.error(
        `${this.eventName} validation failed`,
        result.error.issues
      );
      pushSocketValidationError(
        this.eventName,
        result.error.issues,
        rawData,
        (level, message, meta) => {
          switch (level) {
            case "debug":
              this.logger.debug(message, meta);
              break;
            case "info":
              this.logger.info(message, meta);
              break;
            case "warn":
              this.logger.warn(message, meta);
              break;
            case "error":
              this.logger.error(message, meta);
              break;
          }
        }
      );
      return;
    }

    try {
      await this.handle(result.data);
      this.logger.debug(`${this.eventName} handled successfully`);
    } catch (error) {
      this.logger.error(`${this.eventName} handler error`, error);
      throw error;
    }
  }

  protected abstract handle(data: T): Promise<void> | void;

  protected updateStore(updater: (state: any) => void): void {
    rtcStore.getState().patch(updater);
  }

  protected get livekit() {
    return this.options.livekit;
  }

  protected get autoJoinConfig() {
    return this.options.autoJoinConfig;
  }

  /**
   * Retry logic with exponential backoff for auto-join operations
   */
  protected async retryAutoJoin(
    callId: string,
    token: string,
    url: string,
    attempt = 1
  ): Promise<boolean> {
    const maxAttempts = this.autoJoinConfig?.maxRetries || 2;
    
    // Initialize auto-join state on first attempt
    if (attempt === 1) {
      this.updateStore((state) => {
        state.autoJoin = {
          status: "pending",
          attempt: 1,
          maxAttempts,
          startedAt: Date.now(),
        };
      });
    } else {
      // Update state for retry attempts
      this.updateStore((state) => {
        state.autoJoin.status = "retrying";
        state.autoJoin.attempt = attempt;
      });
    }
    
    if (attempt > maxAttempts) {
      this.logger.warn("Max retry attempts reached for auto-join", {
        callId,
        maxAttempts,
        finalAttempt: attempt - 1,
      });
      
      // Mark as failed
      this.updateStore((state) => {
        state.autoJoin.status = "failed";
        state.autoJoin.completedAt = Date.now();
        state.autoJoin.lastError = "Max retry attempts reached";
      });
      
      return false;
    }

    try {
      this.logger.info("Attempting auto-join", {
        callId,
        attempt,
        maxAttempts,
      });

      await this.livekit?.joinRoom(token, url);
      
      this.logger.info("Auto-join successful", {
        callId,
        attempt,
      });
      
      // Mark as succeeded
      this.updateStore((state) => {
        state.autoJoin.status = "succeeded";
        state.autoJoin.completedAt = Date.now();
      });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      this.logger.warn("Auto-join attempt failed", {
        callId,
        attempt,
        maxAttempts,
        error: errorMessage,
      });

      // Update state with error
      this.updateStore((state) => {
        state.autoJoin.lastError = errorMessage;
      });

      if (attempt < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        // biome-ignore lint/style/useExponentiationOperator: <explanation>
                const delayMs = Math.pow(2, attempt - 1) * 1000;
        this.logger.debug("Retrying auto-join after delay", {
          callId,
          nextAttempt: attempt + 1,
          delayMs,
        });

        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.retryAutoJoin(callId, token, url, attempt + 1);
      }

      // Mark as failed after all attempts
      this.updateStore((state) => {
        state.autoJoin.status = "failed";
        state.autoJoin.completedAt = Date.now();
      });

      return false;
    }
  }

  /**
   * Determines if an error is retryable
   */
  protected isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || "";
    const retryableErrors = [
      "network",
      "timeout",
      "connection",
      "websocket",
      "transport",
    ];
    
    return retryableErrors.some(keyword => errorMessage.includes(keyword));
  }
}
