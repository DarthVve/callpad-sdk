import type { ZodSchema } from "zod";
import { pushSocketValidationError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import { createLogger } from "../../../utils/logger";
import type { CallpadLogger } from "../../../utils/logger";
import type { AuthManager } from "../../auth.manager";

export interface SocketHandlerOptions {
  livekit?: any;
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
