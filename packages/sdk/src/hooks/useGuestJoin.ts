import type { GuestJoinResponse } from "../clients/signal";
import { useGuestSdk } from "../provider/RtcProvider";
import type { GuestJoinMeetingParams } from "../services/meetings.service";

export interface UseGuestJoinReturn {
  guestJoin: (params: GuestJoinMeetingParams) => Promise<GuestJoinResponse>;
}

export function useGuestJoin(): UseGuestJoinReturn {
  const sdk = useGuestSdk();

  return {
    guestJoin: sdk.guestJoin,
  };
}
