import { PresenceService } from "../../../generated/api";
import type { PresenceData } from "../../../generated/api/models";

export class SignalPresenceService {
  constructor(private appId: string) {}

  /**
   * Query presence for multiple user IDs
   */
  async queryPresence(
    userIds: string[]
  ): Promise<PresenceData["responses"]["PostSignalPresence"]> {
    return PresenceService.postSignalPresence({
      requestBody: { userIds },
    });
  }
}
