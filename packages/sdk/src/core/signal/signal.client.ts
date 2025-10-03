import { CallsService } from "../../generated/api";
import type { CallsData } from "../../generated/api/models";
import type {
  CallActionResponse,
  CallResponse,
  InitiateCallParams,
  SignalClientConfig,
} from "./types";

export class SignalClient {
  private config: SignalClientConfig;

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
      return CallsService.postSignalCallsByCallIdAccept({
        callId,
        appId: this.config.appId,
      });
    } catch (error) {
      this.handleApiError("accept", error);
      throw error;
    }
  }

  async decline(callId: string): Promise<CallActionResponse> {
    try {
      return CallsService.postSignalCallsByCallIdDecline({
        callId,
        appId: this.config.appId,
      });
    } catch (error) {
      this.handleApiError("decline", error);
      throw error;
    }
  }

  async leave(callId: string): Promise<CallActionResponse> {
    try {
      return CallsService.postSignalCallsByCallIdLeave({
        callId,
        appId: this.config.appId,
      });
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
    console.error(`Signal API error during ${operation}: ${errorMessage}`, {
      operation,
      errorCode,
      error,
    });
  }
}
