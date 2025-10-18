import { SignalCallsService } from "../clients/signal";
import type { CallsData } from "../generated/api/models";
import { rtcStore } from "../state/store";

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
  const signalCalls = new SignalCallsService(appId);

  async function initiate(
    params: InitiateCallParams
  ): Promise<CallsData["responses"]["PostSignalCallsInvite"]> {
    const requestBody: NonNullable<
      CallsData["payloads"]["PostSignalCallsInvite"]["requestBody"]
    > = {
      participants: params.invitees.map((userId) => ({ userId: String(userId) })),
    };

    if (params.callId) {
      requestBody.callId = params.callId;
    } else {
        requestBody.mode = params.mode || "AUDIO";
    }

    const response = await signalCalls.invite({
      requestBody,
    });

      rtcStore.getState().patch((state) => {
      for (const participant of response.participants) {
        if (participant.userId) {
          state.outgoingInvites[participant.userId] = {
            userId: participant.userId,
            status: "sent",
            participant: {
              userId: participant.userId,
              role: participant.role,
              firstName: participant.firstName ?? "",
              lastName: participant.lastName ?? "",
              username: participant.username ?? "",
              email: participant.email ?? "",
              profilePhoto: participant.profilePhoto ?? "",
            },
          };
        }
      }

      if (!params.callId) {
          state.initiated = true;
          state.session = {
              id: response.callId,
              status: response.status.toLowerCase() as any,
              mode: "AUDIO",
              role: "HOST"
          }
      }

      if (response.joinInfo && state.session) {
        state.session.livekitInfo = {
          token: response.joinInfo.token,
          roomName: state.session.id,
          url: response.joinInfo.lkUrl,
        };
      }
    });

    return response;
  }

  async function accept(): Promise<
    CallsData["responses"]["PostSignalCallsByCallIdAccept"]
  > {
    const currentState = rtcStore.getState();
    if (!currentState.incomingInvite) {
      throw new Error("No incoming invite to accept");
    }

    const { callId, inviteId } = currentState.incomingInvite;
    rtcStore.getState().patch((state) => {
      state.incomingInvite = null;
    });

    const response = await signalCalls.accept({
      callId,
      requestBody: {
        inviteId,
      },
    });

    rtcStore.getState().patch((state) => {
      if (response.joinInfo && state.session) {
        state.session.status = "ready";
        state.session.livekitInfo = {
          token: response.joinInfo.token,
          roomName: state.session.id,
          url: response.joinInfo.lkUrl,
        };
      }
    });

    return response;
  }

  async function decline(
    reason?: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdDecline"]> {
    const currentState = rtcStore.getState();
    if (!currentState.incomingInvite) {
      throw new Error("No incoming invite to decline");
    }

    const { callId, inviteId } = currentState.incomingInvite;

    const requestBody: NonNullable<
      CallsData["payloads"]["PostSignalCallsByCallIdDecline"]["requestBody"]
    > = {
      inviteId,
    };

    if (reason) {
      requestBody.reason = reason;
    }

    return signalCalls.decline({
      callId,
      requestBody,
    });
  }

  async function cancel(
    callId: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdCancel"]> {
    return signalCalls.cancel({
      callId,
    });
  }

  async function leave(
    callId: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdLeave"]> {
    const [apiResponse] = await Promise.all([
      signalCalls.leave({
        callId,
      }),
      Promise.resolve(rtcStore.getState().reset())
    ]);

    return apiResponse;
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
    return signalCalls.transfer({
      callId,
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
    return signalCalls.kick({
      callId,
      requestBody,
    });
  }

  async function mute(
    callId: string,
    participantId: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdMute"]> {
    return signalCalls.mute({
      callId,
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
    transfer,
    kick,
    mute,
  };
}

export type CallsServiceInstance = ReturnType<typeof createCallsService>;
