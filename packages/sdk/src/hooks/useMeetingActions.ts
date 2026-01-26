import { useSdk } from "../provider/RtcProvider";
import type {
  CreateAdHocMeetingParams,
  JoinMeetingParams,
} from "../state/meetings.types";
import { rtcStore } from "../state/store";

export function useMeetingActions() {
  const sdk = useSdk();

  return {
    createAdHoc: (params?: CreateAdHocMeetingParams) => {
      return sdk.meetings.createAdHoc(params);
    },
    start: (meetingId: string) => {
      return sdk.meetings.start(meetingId);
    },
    join: (params: JoinMeetingParams) => {
      return sdk.meetings.join(params);
    },
    end: () => {
      const session = rtcStore.getState().session;
      if (!session?.meetingInfo?.meetingId) {
        throw new Error("No active meeting to end");
      }

      return sdk.meetings.end(session.meetingInfo.meetingId);
    },
    leave: () => {
      const session = rtcStore.getState().session;
      if (!session) {
        throw new Error("No active meeting to leave");
      }

      return sdk.meetings.leave();
    },
  };
}
