import { CallsService } from "../../generated/api";
import { OpenAPI } from "../../generated/api";
import type { AuthManager } from "../auth.manager";
import type { SocketManager } from "../socketio";
import { EventBus } from "../socketio";
import type {
  CallInfo,
  CallResponse,
  InitiateCallParams,
  SignalClientConfig,
  SignalEvents,
} from "./types";
import { SignalError } from "./types";

export class SignalClient {
  private socketManager: SocketManager;
  private authManager: AuthManager;
  private config: SignalClientConfig;
  private eventBus = new EventBus<SignalEvents>();

  constructor(config: SignalClientConfig) {
    this.config = config;
    this.socketManager = config.socketManager;
    this.authManager = config.authManager;

    OpenAPI.BASE = config.baseUrl;
    OpenAPI.TOKEN = async () => {
      const token = this.authManager.getCurrentToken();
      return token || "";
    };
  }

  async initiate(params: InitiateCallParams): Promise<CallResponse> {
    try {
      const response = await CallsService.postSignalCalls({
        appId: this.config.appId,
        requestBody: {
          mode: params.mode || "AUDIO",
          participants: params.invitees.map((userId) => ({ userId })),
        },
      });

      this.eventBus.emit("call.initiated", response as CallInfo);
      return response as CallResponse;
    } catch (error) {
      this.handleApiError("initiate", error);
      throw error;
    }
  }

  async accept(callId: string): Promise<void> {
    try {
      await CallsService.postSignalCallsByCallIdAccept({
        callId,
        appId: this.config.appId,
      });
    } catch (error) {
      this.handleApiError("accept", error);
      throw error;
    }
  }

  async decline(callId: string, reason?: string): Promise<void> {
    try {
      await CallsService.postSignalCallsByCallIdDecline({
        callId,
        appId: this.config.appId,
      });

      this.eventBus.emit("call.declined", { callId, reason });
    } catch (error) {
      this.handleApiError("decline", error);
      throw error;
    }
  }

  async end(callId: string): Promise<void> {
    try {
      await CallsService.postSignalCallsByCallIdEnd({
        callId,
        appId: this.config.appId,
      });

      this.eventBus.emit("call.ended", { callId, reason: "ended" });
    } catch (error) {
      this.handleApiError("end", error);
      throw error;
    }
  }

  private handleApiError(operation: string, error: any): void {
    const errorMessage =
      error?.body?.message || error?.message || "Unknown error";
    const errorCode = error?.status || error?.code || "UNKNOWN";

    this.eventBus.emit(
      "error",
      new SignalError(
        `Signal API error during ${operation}: ${errorMessage}`,
        `SIGNAL_${operation.toUpperCase()}_ERROR`,
        errorCode
      )
    );
  }

  on<K extends keyof SignalEvents>(
    event: K,
    handler: (data: SignalEvents[K]) => void
  ): () => void {
    return this.eventBus.on(event, handler);
  }

  destroy(): void {
    this.eventBus.destroy();
  }
}
