import { useRtcStore } from "../state/store";

export function useInviteAccepted(): boolean {
  return useRtcStore((state) => {
    return Object.values(state.outgoingInvites).some(
      (invite) => invite.status === "accepted"
    );
  });
}
