import { useRtcStore } from "../state/store";
import type { SessionStatus } from "../state/types";

export interface CallState {
  id: string | undefined;
  status: SessionStatus;
  mode: "AUDIO" | "VIDEO" | undefined;
  roomName: string | undefined;
}

export function useCallState(): CallState {
  const session = useRtcStore((state) => state.session);

  return {
    id: session.id,
    status: session.status,
    mode: session.mode,
    roomName: session.livekitInfo?.roomName,
  };
}
