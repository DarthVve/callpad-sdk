import { CallsService } from "../generated/api";
import type { CallsData } from "../generated/api/models";

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

  async function initiate(
    params: InitiateCallParams
  ): Promise<CallsData["responses"]["PostSignalCallsInvite"]> {
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
    return CallsService.postSignalCallsByCallIdAccept({
      callId,
      appId,
    });
  }

  async function decline(
    callId: string,
    reason?: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdDecline"]> {
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
    return CallsService.postSignalCallsByCallIdCancel({
      callId,
      appId,
    });
  }

  async function leave(
    callId: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdLeave"]> {
    return CallsService.postSignalCallsByCallIdLeave({
      callId,
      appId,
    });
  }

  async function end(
    callId: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdEnd"]> {
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
