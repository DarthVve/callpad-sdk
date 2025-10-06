import { CallsService } from "../../generated/api";
import type { CallsData } from "../../generated/api/models";
import { createLogger } from "../../utils/logger";
import type {
  CallActionResponse,
  CallResponse,
  InitiateCallParams,
  SignalClientConfig,
} from "./types";

export class SignalClient {
  private config: SignalClientConfig;
  private logger = createLogger("signal");

  constructor(config: SignalClientConfig) {
    this.config = config;
  }

  async initiate(params: InitiateCallParams): Promise<CallResponse> {
    try {
      return await CallsService.postSignalCalls({
        appId: this.config.appId,
        requestBody: {
          mode: params.mode || "AUDIO",
          participants: params.invitees.map((userId) => ({ userId })),
        },
      });
    } catch (error) {
      this.handleApiError("initiate", error);
      throw error;
    }
  }

  async accept(callId: string): Promise<CallActionResponse> {
    try {
      const response = await CallsService.postSignalCallsByCallIdAccept({
        callId,
        appId: this.config.appId,
      });
      return {
        ...response,
        callId,
        state: "ACTIVE" as const,
        message: "Call accepted",
      };
    } catch (error) {
      this.handleApiError("accept", error);
      throw error;
    }
  }

  async decline(callId: string): Promise<CallActionResponse> {
    try {
      const response = await CallsService.postSignalCallsByCallIdDecline({
        callId,
        appId: this.config.appId,
      });
      return {
        ...response,
        callId,
        state: "ENDED" as const,
        message: "Call declined",
      };
    } catch (error) {
      this.handleApiError("decline", error);
      throw error;
    }
  }

  async leave(callId: string): Promise<CallActionResponse> {
    try {
      const response = await CallsService.postSignalCallsByCallIdLeave({
        callId,
        appId: this.config.appId,
      });
      return {
        ...response,
        callId,
        state: "ENDED" as const,
        message: "Left call",
      };
    } catch (error) {
      this.handleApiError("leave", error);
      throw error;
    }
  }

  private handleApiError(operation: string, error: any): void {
    const errorMessage =
      error?.body?.message || error?.message || "Unknown error";
    const errorCode = error?.status || error?.code || "UNKNOWN";

    // Log error for debugging - real-time error handling happens via Socket.IO
    this.logger.error(`Signal API error during ${operation}`, {
      operation,
      errorCode,
      errorMessage,
      error,
    });
  }
}
