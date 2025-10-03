import { useRtcStore } from "../state/store";
import type { IncomingCallInfo, SessionStatus } from "../state/types";

export interface CallState {
  id: string | undefined;
  status: SessionStatus;
  mode: "AUDIO" | "VIDEO" | undefined;
  roomName: string | undefined;
  incomingCall: IncomingCallInfo | undefined;
}

export function useCallState(): CallState {
  const session = useRtcStore((state) => state.session);
  const incomingCall = useRtcStore((state) => state.incomingCall);

  return {
    id: session.id,
    status: session.status,
    mode: session.mode,
    roomName: session.roomName,
    incomingCall,
  };
}
