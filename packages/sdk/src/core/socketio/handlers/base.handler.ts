import type { ZodSchema } from "zod";
import { pushSocketValidationError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";

export interface SocketHandlerOptions {
  log?: (
    level: "debug" | "info" | "warn" | "error",
    message: string,
    extra?: any
  ) => void;
  livekit?: any;
}

export abstract class BaseSocketHandler<T = any> {
  protected abstract readonly eventName: string;
  protected abstract readonly schema: ZodSchema<T>;

  constructor(protected readonly options: SocketHandlerOptions = {}) {}

  async handleRaw(rawData: unknown): Promise<void> {
    this.log("info", `${this.eventName} received`, rawData);

    const result = this.schema.safeParse(rawData);
    if (!result.success) {
      this.log(
        "error",
        `${this.eventName} validation failed`,
        result.error.issues
      );
      pushSocketValidationError(
        this.eventName,
        result.error.issues,
        rawData,
        this.options.log
      );
      return;
    }

    try {
      await this.handle(result.data);
      this.log("debug", `${this.eventName} handled successfully`);
    } catch (error) {
      this.log("error", `${this.eventName} handler error`, error);
      throw error;
    }
  }

  protected abstract handle(data: T): Promise<void> | void;

  protected updateStore(updater: (state: any) => void): void {
    rtcStore.getState().patch(updater);
  }

  protected log(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    extra?: any
  ): void {
    console.log(`📨 ${this.eventName}: ${message}`, extra);
    this.options.log?.(level, message, extra);
  }

  protected get livekit() {
    return this.options.livekit;
  }
}
