import { useRtcStore } from "../state/store";

export function useIsGuestMode(): boolean {
  return useRtcStore((state) => state.isGuestMode);
}
