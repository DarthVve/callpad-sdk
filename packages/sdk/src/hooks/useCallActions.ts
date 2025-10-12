import { useSdk } from "../provider/RtcProvider";

export function useCallActions() {
  const sdk = useSdk();

  return {
    initiate: (participants: string[], type: "AUDIO" | "VIDEO") => {
      return sdk.calls.initiate({ invitees: participants, mode: type });
    },
    accept: (callId: string) => {
      return sdk.calls.accept(callId);
    },
    decline: (callId: string, reason?: string) => {
      return sdk.calls.decline(callId, reason);
    },
    cancel: (callId: string) => {
      return sdk.calls.cancel(callId);
    },
    leave: (callId: string) => {
      return sdk.calls.leave(callId);
    },
    end: (callId: string) => {
      return sdk.calls.end(callId);
    },
    transfer: (callId: string, targetParticipantId: string, reason?: string) => {
      return sdk.calls.transfer(callId, targetParticipantId, reason);
    },
    kick: (callId: string, participantId: string, reason?: string) => {
      return sdk.calls.kick(callId, participantId, reason);
    },
    mute: (callId: string, participantId: string) => {
      return sdk.calls.mute(callId, participantId);
    },
  };
}
