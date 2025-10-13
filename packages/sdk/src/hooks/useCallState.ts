import { useRtcStore } from "../state/store";

export interface CallState {
  id: string | null;
  status: "pending" | "active" | "ended" | "ready" | null;
  mode: "AUDIO" | "VIDEO" | null;
  roomName: string | null;
}

export function useCallState(): CallState {
  const session = useRtcStore((state) => state.session);

  if (!session) {
    return {
      id: null,
      status: null,
      mode: null,
      roomName: null,
    };
  }

  return {
    id: session.id,
    status: session.status,
    mode: session.mode,
    roomName: session.livekitInfo?.roomName || null,
  };
}
