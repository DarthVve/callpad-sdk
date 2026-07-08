import { useRtcStore } from "../state/store";

/**
 * Check if there's an active session.
 * Returns true if there's a session with status "pending" or "active".
 * Returns false if no session exists or if the session has ended.
 */
export function useHasActiveSession(): boolean {
  return useRtcStore((state) => {
    if (!state.session) {
      return false;
    }
    return (
      state.session.status === "pending" || state.session.status === "active"
    );
  });
}
