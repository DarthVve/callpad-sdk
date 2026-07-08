import { MeetingsService } from "../../../generated/api";
import type { MeetingsData } from "../../../generated/api/models";

export interface GuestJoinParams {
  meetingCode: string;
  displayName: string;
  passcode?: string;
  appId: string;
  deviceId: string;
}

export interface GuestJoinResponse {
  meeting: {
    id: string;
    code: string;
    status: "ACTIVE";
    callId: string;
  };
  joinInfo: {
    token: string;
    lkUrl: string;
  };
  sessionToken: string;
  guestId: string;
  sessionType: "MEETING";
}

export type GuestErrorCode =
  | "SESSION_NOT_FOUND"
  | "GUEST_ACCESS_DISABLED"
  | "INVALID_PASSCODE"
  | "MEETING_NOT_ACTIVE"
  | "VALIDATION_ERROR"
  | "UNKNOWN";

export class GuestJoinError extends Error {
  public readonly code: GuestErrorCode;

  constructor(
    message: string,
    public readonly statusCode: number,
    code?: GuestErrorCode
  ) {
    super(message);
    this.name = "GuestJoinError";
    this.code = code || this.mapStatusToCode(statusCode);
  }

  private mapStatusToCode(status: number): GuestErrorCode {
    switch (status) {
      case 404:
        return "SESSION_NOT_FOUND";
      case 403:
        return "GUEST_ACCESS_DISABLED";
      case 401:
        return "INVALID_PASSCODE";
      case 400:
        return "MEETING_NOT_ACTIVE";
      case 422:
        return "VALIDATION_ERROR";
      default:
        return "UNKNOWN";
    }
  }
}

export class SignalMeetingsService {
  constructor(private appId: string) {}

  async createAdHoc(
    params: MeetingsData["payloads"]["PostSignalMeetingsCreate"]
  ): Promise<MeetingsData["responses"]["PostSignalMeetingsCreate"]> {
    return MeetingsService.postSignalMeetingsCreate(params);
  }

  async start(
    params: MeetingsData["payloads"]["PostSignalMeetingsByMeetingIdStart"]
  ): Promise<MeetingsData["responses"]["PostSignalMeetingsByMeetingIdStart"]> {
    return MeetingsService.postSignalMeetingsByMeetingIdStart(params);
  }

  async join(
    params: MeetingsData["payloads"]["PostSignalMeetingsJoin"]
  ): Promise<MeetingsData["responses"]["PostSignalMeetingsJoin"]> {
    return MeetingsService.postSignalMeetingsJoin(params);
  }

  async end(
    params: MeetingsData["payloads"]["PostSignalMeetingsByMeetingIdEnd"]
  ): Promise<MeetingsData["responses"]["PostSignalMeetingsByMeetingIdEnd"]> {
    return MeetingsService.postSignalMeetingsByMeetingIdEnd(params);
  }

  async guestJoin(
    params: GuestJoinParams,
    baseUrl: string
  ): Promise<GuestJoinResponse> {
    const response = await fetch(`${baseUrl}/signal/meetings/guest-join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new GuestJoinError(
        error.message || error.error?.message || "Failed to join meeting",
        response.status
      );
    }

    return response.json();
  }
}
