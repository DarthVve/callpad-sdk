import { CallsService } from "../../../generated/api";
import type { CallsData } from "../../../generated/api/models";

export class SignalCallsService {
  constructor(private appId: string) {}

  async getCall(
    params: Omit<CallsData["payloads"]["GetSignalCallsByCallId"], "appId">
  ): Promise<CallsData["responses"]["GetSignalCallsByCallId"]> {
    return CallsService.getSignalCallsByCallId({
      ...params,
      appId: this.appId,
    });
  }

  async invite(
    params: Omit<CallsData["payloads"]["PostSignalCallsInvite"], "appId">
  ): Promise<CallsData["responses"]["PostSignalCallsInvite"]> {
    return CallsService.postSignalCallsInvite({
      ...params,
      appId: this.appId,
    });
  }

  async accept(
    params: Omit<CallsData["payloads"]["PostSignalCallsByCallIdAccept"], "appId">
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdAccept"]> {
    return CallsService.postSignalCallsByCallIdAccept({
      ...params,
      appId: this.appId,
    });
  }

  async decline(
    params: Omit<CallsData["payloads"]["PostSignalCallsByCallIdDecline"], "appId">
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdDecline"]> {
    return CallsService.postSignalCallsByCallIdDecline({
      ...params,
      appId: this.appId,
    });
  }

  async cancel(
    params: Omit<CallsData["payloads"]["PostSignalCallsByCallIdCancel"], "appId">
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdCancel"]> {
    return CallsService.postSignalCallsByCallIdCancel({
      ...params,
      appId: this.appId,
    });
  }

  async transfer(
    params: Omit<CallsData["payloads"]["PostSignalCallsByCallIdTransfer"], "appId">
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdTransfer"]> {
    return CallsService.postSignalCallsByCallIdTransfer({
      ...params,
      appId: this.appId,
    });
  }

  async kick(
    params: Omit<CallsData["payloads"]["PostSignalCallsByCallIdKick"], "appId">
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdKick"]> {
    return CallsService.postSignalCallsByCallIdKick({
      ...params,
      appId: this.appId,
    });
  }

  async mute(
    params: Omit<CallsData["payloads"]["PostSignalCallsByCallIdMute"], "appId">
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdMute"]> {
    return CallsService.postSignalCallsByCallIdMute({
      ...params,
      appId: this.appId,
    });
  }

  async leave(
    params: Omit<CallsData["payloads"]["PostSignalCallsByCallIdLeave"], "appId">
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdLeave"]> {
    return CallsService.postSignalCallsByCallIdLeave({
      ...params,
      appId: this.appId,
    });
  }
}