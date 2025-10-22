import { SignalCallsService } from "../clients/signal";
import type { CallsData } from "../generated/api/models";
import { profileCache } from "../state/profileCache";
import { rtcStore } from "../state/store";

export interface CallsServiceConfig {
  appId: string;
}

export interface InitiateCallParams {
  invitees: string[];
  mode?: "AUDIO" | "VIDEO";
  callId?: string;
}

export interface CallsServiceDependencies {
  livekitManager?: { disconnect: () => Promise<void> };
}

export function createCallsService(
  config: CallsServiceConfig,
  deps?: CallsServiceDependencies
) {
  const { appId } = config;
  const signalCalls = new SignalCallsService(appId);

  profileCache.getState().configure(appId);

  async function initiate(
    params: InitiateCallParams
  ): Promise<
    | CallsData["responses"]["PostSignalCallsInitiate"]
    | CallsData["responses"]["PostSignalCallsInvite"]
  > {
    try {
        console.log(params, 'params')
      if (!params.callId) {
        // Set optimistic state immediately
        rtcStore.getState().patch((state) => {
          state.session = {
            id: "temp",
            status: "initializing",
            mode: params.mode || "AUDIO",
            role: "HOST",
          };
          state.initiated = true;
        });
        console.log('state: ', rtcStore.getState())

        const response = await signalCalls.initiate({
          requestBody: {
            inviteeIds: params.invitees,
            mode: params.mode || "AUDIO",
          },
        });

        if (response.participants && response.participants.length > 0) {
          profileCache.getState().addMany(
            response.participants.map((p) => ({
              userId: p.userId,
              username: p.username,
              firstName: p.firstName,
              lastName: p.lastName,
              profilePhoto: p.profilePhoto,
            }))
          );
        }

        rtcStore.getState().patch((state) => {
          state.initiated = true;
          state.session = {
            id: response.callId,
            status: "pending",
            mode: params.mode || "AUDIO",
            role: "HOST",
            ringTimeoutMs: response.ringTimeoutMs,
          };

          for (const userId of response.inviteeIds) {
            const profile = profileCache.getState().get(userId);
            state.outgoingInvites[userId] = {
              userId,
              status: "sent",
              participant: profile
                ? {
                    userId: profile.userId,
                    role: "PARTICIPANT",
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    username: profile.username,
                    email: "",
                    profilePhoto: profile.profilePhoto,
                  }
                : undefined,
            };
          }

          if (response.joinInfo) {
            state.session.livekitInfo = {
              token: response.joinInfo.token,
              roomName: response.callId,
              url: response.joinInfo.lkUrl,
            };
          }
        });

        return response;
      }
      const response = await signalCalls.invite({
        requestBody: {
          callId: params.callId,
          participants: params.invitees.map((userId) => ({
            userId: String(userId),
          })),
        },
      });

      if (response.participants && response.participants.length > 0) {
        profileCache.getState().addMany(
          response.participants.map((p) => ({
            userId: p.userId,
            username: p.username,
            firstName: p.firstName,
            lastName: p.lastName,
            profilePhoto: p.profilePhoto,
          }))
        );
      }

      rtcStore.getState().patch((state) => {
        for (const userId of response.inviteeIds) {
          const profile = profileCache.getState().get(userId);
          state.outgoingInvites[userId] = {
            userId,
            status: "sent",
            participant: profile
              ? {
                  userId: profile.userId,
                  role: "PARTICIPANT",
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                  username: profile.username,
                  email: "",
                  profilePhoto: profile.profilePhoto,
                }
              : undefined,
          };
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
    } catch (error: any) {
      // Clear optimistic state on error
      rtcStore.getState().patch((state) => {
        state.session = null;
        state.initiated = false;
      });
      rtcStore.getState().addError({
        code: "INITIATE_FAILED",
        message: error.message || "Failed to initiate call",
        timestamp: Date.now(),
        context: error,
      });
      throw error;
    }
  }

  async function accept(): Promise<
    CallsData["responses"]["PostSignalCallsByCallIdAccept"]
  > {
    const currentState = rtcStore.getState();
    if (!currentState.incomingInvite) {
      throw new Error("No incoming invite to accept");
    }

    const { callId, inviteId, mode } = currentState.incomingInvite;
    
    // Set optimistic state immediately
    rtcStore.getState().patch((state) => {
      state.session = {
        id: callId,
        status: "initializing",
        mode: mode,
        role: "PARTICIPANT",
      };
      state.incomingInvite = null;
    });

    try {
      const response = await signalCalls.accept({
        callId,
        requestBody: {
          inviteId,
        },
      });

      rtcStore.getState().patch((state) => {
        // Update the existing optimistic session
        if (state.session && state.session.id === callId) {
          state.session.status = "ready";
          
          // Set startedAt - use backend value if available, otherwise generate locally
          if (response.call?.startedAt) {
            state.session.startedAt = response.call.startedAt;
          } else {
            state.session.startedAt = new Date().toISOString();
          }
          
          if (response.joinInfo) {
            state.session.livekitInfo = {
              token: response.joinInfo.token,
              roomName: state.session.id,
              url: response.joinInfo.lkUrl,
            };

            if (response.ringTimeoutMs) {
              state.session.ringTimeoutMs = response.ringTimeoutMs;
            }
          }
        }
      });

      return response;
    } catch (error: any) {
      // Rollback optimistic state on error
      rtcStore.getState().patch((state) => {
        state.session = null;
        state.incomingInvite = currentState.incomingInvite;
      });
      rtcStore.getState().addError({
        code: "ACCEPT_FAILED",
        message: error.message || "Failed to accept call",
        timestamp: Date.now(),
        context: error,
      });
      throw error;
    }
  }

  async function decline(
    reason?: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdDecline"]> {
    try {
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
    } catch (error: any) {
      rtcStore.getState().addError({
        code: "DECLINE_FAILED",
        message: error.message || "Failed to decline call",
        timestamp: Date.now(),
        context: error,
      });
      throw error;
    }
  }

  async function cancel(
    callId: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdCancel"]> {
    try {
      return signalCalls.cancel({
        callId,
      });
    } catch (error: any) {
      rtcStore.getState().addError({
        code: "CANCEL_FAILED",
        message: error.message || "Failed to cancel call",
        timestamp: Date.now(),
        context: error,
      });
      throw error;
    }
  }

  async function leave(): Promise<void> {
    try {
      if (deps?.livekitManager) {
        await deps.livekitManager.disconnect();
      } else {
        rtcStore.getState().reset();
        profileCache.getState().clear();
      }
    } catch (error: any) {
      rtcStore.getState().addError({
        code: "LEAVE_FAILED",
        message: error.message || "Failed to leave call",
        timestamp: Date.now(),
        context: error,
      });
      throw error;
    }
  }

  async function transfer(
    callId: string,
    targetParticipantId: string,
    reason?: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdTransfer"]> {
    try {
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
    } catch (error: any) {
      rtcStore.getState().addError({
        code: "TRANSFER_FAILED",
        message: error.message || "Failed to transfer call",
        timestamp: Date.now(),
        context: error,
      });
      throw error;
    }
  }

  async function kick(
    callId: string,
    participantId: string,
    reason?: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdKick"]> {
    try {
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
    } catch (error: any) {
      rtcStore.getState().addError({
        code: "KICK_FAILED",
        message: error.message || "Failed to kick participant",
        timestamp: Date.now(),
        context: error,
      });
      throw error;
    }
  }

  async function mute(
    callId: string,
    participantId: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdMute"]> {
    try {
      return signalCalls.mute({
        callId,
        requestBody: {
          participantId,
        },
      });
    } catch (error: any) {
      rtcStore.getState().addError({
        code: "MUTE_FAILED",
        message: error.message || "Failed to mute participant",
        timestamp: Date.now(),
        context: error,
      });
      throw error;
    }
  }

  async function end(
    callId: string
  ): Promise<CallsData["responses"]["PostSignalCallsByCallIdEnd"]> {
    try {
      const response = await signalCalls.end({
        callId,
      });

      rtcStore.getState().reset();
      profileCache.getState().clear();

      return response;
    } catch (error: any) {
      rtcStore.getState().addError({
        code: "END_CALL_FAILED",
        message: error.message || "Failed to end call",
        timestamp: Date.now(),
        context: error,
      });
      throw error;
    }
  }

  async function invite(
    callId: string,
    invitees: string[]
  ): Promise<CallsData["responses"]["PostSignalCallsInvite"]> {
    try {
      const response = await signalCalls.invite({
        requestBody: {
          callId,
          participants: invitees.map((userId) => ({ userId: String(userId) })),
        },
      });

      if (response.participants && response.participants.length > 0) {
        profileCache.getState().addMany(
          response.participants.map((p) => ({
            userId: p.userId,
            username: p.username,
            firstName: p.firstName,
            lastName: p.lastName,
            profilePhoto: p.profilePhoto,
          }))
        );
      }

      rtcStore.getState().patch((state) => {
        for (const userId of response.inviteeIds) {
          const profile = profileCache.getState().get(userId);
          state.outgoingInvites[userId] = {
            userId,
            status: "sent",
            participant: profile
              ? {
                  userId: profile.userId,
                  role: "PARTICIPANT",
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                  username: profile.username,
                  email: "",
                  profilePhoto: profile.profilePhoto,
                }
              : undefined,
          };
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
    } catch (error: any) {
      rtcStore.getState().addError({
        code: "INVITE_FAILED",
        message: error.message || "Failed to send invites",
        timestamp: Date.now(),
        context: error,
      });
      throw error;
    }
  }

  return {
    initiate,
    invite,
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
