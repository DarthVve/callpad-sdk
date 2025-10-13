import { useRtcStore } from "../state/store";

/**
 * Get the current session ID.
 * Returns null when no active session.
 */
export function useSessionId(): string | null {
  return useRtcStore((state) => state.session?.id ?? null);
}
