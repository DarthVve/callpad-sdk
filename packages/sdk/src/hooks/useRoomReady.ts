import { useLivekitInfo } from "./useLivekitInfo";
import { useCallState } from "./useCallState";

/**
 * Determines if LiveKit room is ready for connection.
 * Returns true when credentials are available and status is "ready" or "active".
 */
export function useRoomReady(): boolean {
  const livekitInfo = useLivekitInfo();
  const { status } = useCallState();

  return livekitInfo !== null && (status === "ready" || status === "active");
}