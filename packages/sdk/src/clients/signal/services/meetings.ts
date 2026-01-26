import { MeetingsService } from "../../../generated/api";
import type { MeetingsData } from "../../../generated/api/models";

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
}
