import { useRtcStore } from "../state/store";

export interface MeetingState {
  meetingId: string | null;
  meetingCode: string | null;
  isInMeeting: boolean;
  isOrganizer: boolean;
}

export function useMeetingState(): MeetingState {
  const session = useRtcStore((state) => state.session);

  const isInMeeting = session?.sessionType === "MEETING";
  const isOrganizer = isInMeeting && session?.role === "HOST";

  return {
    meetingId: session?.meetingInfo?.meetingId ?? null,
    meetingCode: session?.meetingInfo?.meetingCode ?? null,
    isInMeeting,
    isOrganizer,
  };
}
