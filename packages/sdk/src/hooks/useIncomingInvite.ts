import { useRtcStore } from "../state/store";
import type { IncomingInvite } from "../state/types";

export function useIncomingInvite(): IncomingInvite | null {
  return useRtcStore((state) => state.incomingInvite);
}
