export type SessionType = "CALL" | "MEETING";

export type MeetingStatus = "SCHEDULED" | "ACTIVE" | "ENDED";

export interface MeetingInfo {
  meetingId: string;
  meetingCode: string;
}

export interface Meeting {
  id: string;
  code: string;
  status: MeetingStatus;
  callId: string;
}

export interface MeetingJoinInfo {
  token: string;
  lkUrl: string;
}

export interface CreateAdHocMeetingParams {
  mode?: "AUDIO" | "VIDEO";
  title?: string;
}

export interface JoinMeetingParams {
  meetingCode?: string;
  meetingId?: string;
}

export interface MeetingResponse {
  meeting: Meeting;
  joinInfo: MeetingJoinInfo;
  sessionType: SessionType;
}

export interface EndMeetingResponse {
  success: boolean;
  meetingId: string;
}
