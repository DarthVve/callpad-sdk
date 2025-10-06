import { useSdk } from "../provider/RtcProvider";

export function useCallActions() {
  const sdk = useSdk();

  return {
    initiate: (participants: string[], type: "AUDIO" | "VIDEO") => {
      return sdk.initiate({ invitees: participants, mode: type });
    },
    accept: (callId: string) => {
      return sdk.accept(callId);
    },
    decline: (callId: string) => {
      return sdk.decline(callId);
    },
    end: (callId: string) => {
      return sdk.leave(callId);
    },
    cancel: (callId: string) => {
      return sdk.leave(callId);
    },
    join: () => {
      return sdk.join();
    },
  };
}

export type CallActionsHook = ReturnType<typeof useCallActions>;
