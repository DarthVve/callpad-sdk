import { useRtcStore } from "../state/store";
import type { LiveKitJoinInfo } from "../state/types";

/**
 * Get the current LiveKit join information.
 * Returns null when no active session or LiveKit info is not available.
 */
export function useLivekitInfo(): LiveKitJoinInfo | null {
  return useRtcStore((state) => state.session?.livekitInfo ?? null);
}
