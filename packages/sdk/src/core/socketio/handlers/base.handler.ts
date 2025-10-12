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

/**
 * Base handler for Socket.IO events with automatic validation and type safety.
 *
 * @template TPayload - The type of the event payload
 */
export abstract class BaseSocketHandler<TPayload = any> {
  protected abstract readonly eventName: string;
  protected abstract readonly schema: ZodSchema<TPayload>;
  private _logger?: CallpadLogger;

  constructor(protected readonly options: SocketHandlerOptions = {}) {}

  protected get logger(): CallpadLogger {
    if (!this._logger) {
      this._logger = createLogger(`socketio:${this.eventName}`);
    }
    return this._logger;
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

  protected abstract handle(data: TPayload): Promise<void> | void;

  protected updateStore(updater: (state: any) => void): void {
    rtcStore.getState().patch(updater);
  }

  protected get livekit() {
    return this.options.livekit;
  }
}
