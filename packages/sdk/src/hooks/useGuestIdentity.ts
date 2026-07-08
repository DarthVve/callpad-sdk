import { useRtcStore } from "../state/store";
import type { GuestIdentity } from "../state/types";

export function useGuestIdentity(): GuestIdentity | null {
  return useRtcStore((state) => state.guestIdentity);
}
