import { useRtcStore } from "../state/store";
import type { OutgoingInvite } from "../state/types";

export function useOutgoingInvites(): Record<string, OutgoingInvite> {
  return useRtcStore((state) => state.outgoingInvites);
}
