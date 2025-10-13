import { CallsService } from "../generated/api";
import type { CallsData } from "../generated/api/models";
import { apiConfig } from "../core/signal/api.config";
import { createLogger } from "../utils/logger";

const logger = createLogger("calls-service");

export interface CallsServiceConfig {
  appId: string;
}

export interface InitiateCallParams {
  invitees: string[];
  mode?: "AUDIO" | "VIDEO";
  callId?: string;
}

export function createCallsService(config: CallsServiceConfig) {
  const { appId } = config;

  // Helper to ensure API is configured before making requests
  const ensureApiConfigured = () => {
    if (!apiConfig.isConfigured()) {
      logger.error("API not configured before making call service request");
      throw new Error(
        "API configuration missing. Ensure the SDK is properly initialized."
      );
    }
  };

  async function initiate(
    params: InitiateCallParams
  ): Promise<CallsData["responses"]["PostSignalCallsInvite"]> {
    ensureApiConfigured();
    const requestBody: NonNullable<
      CallsData["payloads"]["PostSignalCallsInvite"]["requestBody"]
    > = {
      mode: params.mode || "AUDIO",
      participants: params.invitees.map((userId) => ({ userId })),
    };
    if (params.callId) {
      requestBody.callId = params.callId;
    }
    return CallsService.postSignalCallsInvite({
      appId,
      requestBody,
    });
  }

  async function accept(
    callId: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdAccept"]> {
    ensureApiConfigured();
    return CallsService.postSignalCallsByCallIdAccept({
      callId,
      appId,
    });
  }

  async function decline(
    callId: string,
    reason?: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdDecline"]> {
    ensureApiConfigured();
    const payload: CallsData["payloads"]["PostSignalCallsByCallIdDecline"] = {
      callId,
      appId,
    };
    if (reason) {
      payload.requestBody = { reason };
    }
    return CallsService.postSignalCallsByCallIdDecline(payload);
  }

  async function cancel(
    callId: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdCancel"]> {
    ensureApiConfigured();
    return CallsService.postSignalCallsByCallIdCancel({
      callId,
      appId,
    });
  }

  async function leave(
    callId: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdLeave"]> {
    ensureApiConfigured();
    return CallsService.postSignalCallsByCallIdLeave({
      callId,
      appId,
    });
  }

  async function end(
    callId: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdEnd"]> {
    ensureApiConfigured();
    return CallsService.postSignalCallsByCallIdEnd({
      callId,
      appId,
    });
  }

  async function transfer(
    callId: string,
    targetParticipantId: string,
    reason?: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdTransfer"]> {
    ensureApiConfigured();
    const requestBody: NonNullable<
      CallsData["payloads"]["PostSignalCallsByCallIdTransfer"]["requestBody"]
    > = {
      targetParticipantId,
    };
    if (reason) {
      requestBody.reason = reason;
    }
    return CallsService.postSignalCallsByCallIdTransfer({
      callId,
      appId,
      requestBody,
    });
  }

  async function kick(
    callId: string,
    participantId: string,
    reason?: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdKick"]> {
    ensureApiConfigured();
    const requestBody: NonNullable<
      CallsData["payloads"]["PostSignalCallsByCallIdKick"]["requestBody"]
    > = {
      participantId,
    };
    if (reason) {
      requestBody.reason = reason;
    }
    return CallsService.postSignalCallsByCallIdKick({
      callId,
      appId,
      requestBody,
    });
  }

  async function mute(
    callId: string,
    participantId: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdMute"]> {
    ensureApiConfigured();
    return CallsService.postSignalCallsByCallIdMute({
      callId,
      appId,
      requestBody: {
        participantId,
      },
    });
  }

  return {
    initiate,
    accept,
    decline,
    cancel,
    leave,
    end,
    transfer,
    kick,
    mute,
  };
}

export type CallsServiceInstance = ReturnType<typeof createCallsService>;
