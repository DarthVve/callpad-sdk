import { useSdk } from "../provider/RtcProvider";
import { useIncomingInvite } from "./useIncomingInvite";
import { useSessionId } from "./useSessionId";

export function useCallActions() {
  const sdk = useSdk();
  const sessionId = useSessionId();
  const incomingInvite = useIncomingInvite();

  return {
    initiate: (participants: string[], type: "AUDIO" | "VIDEO") => {
      return sdk.calls.initiate({ invitees: participants, mode: type });
    },
    invite: (participants: string[]) => {
      if (!sessionId) {
        throw new Error("No active session to invite participants to");
      }

      const session = sdk.store.getState().session;
      const mode = session?.mode || "VIDEO";

      return sdk.calls.initiate({
        invitees: participants,
        mode,
        callId: sessionId,
      });
    },
    accept: () => {
      if (!incomingInvite) {
        throw new Error("No incoming invite to accept");
      }

      return sdk.calls.accept();
    },
    decline: (reason?: string) => {
      if (!incomingInvite) {
        throw new Error("No incoming invite to decline");
      }

      return sdk.calls.decline(reason);
    },
    cancel: () => {
      if (!sessionId) {
        throw new Error("No active session to cancel");
      }

      return sdk.calls.cancel(sessionId);
    },
    leave: async () => {
      if (!sessionId) {
        throw new Error("No active session to leave");
      }

      return await sdk.calls.leave(sessionId);
    },
    transfer: (targetParticipantId: string, reason?: string) => {
      if (!sessionId) {
        throw new Error("No active session to transfer");
      }

      return sdk.calls.transfer(sessionId, targetParticipantId, reason);
    },
    kick: (participantId: string, reason?: string) => {
      if (!sessionId) {
        throw new Error("No active session to kick participant from");
      }

      return sdk.calls.kick(sessionId, participantId, reason);
    },
    mute: (participantId: string) => {
      if (!sessionId) {
        throw new Error("No active session to mute participant in");
      }

      return sdk.calls.mute(sessionId, participantId);
    },
  };
}
