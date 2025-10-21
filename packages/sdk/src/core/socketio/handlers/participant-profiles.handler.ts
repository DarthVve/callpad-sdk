import type { ParticipantProfilesEvent } from "../../../generated/socket";
import { participantProfilesSchema } from "../../../generated/socket";
import { profileCache } from "../../../state/profileCache";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles participant profile hydration (participant:profiles)
 *
 * Updates the profile cache with received participant information
 * This triggers UI re-renders for components subscribed to the cache
 */
export class ParticipantProfilesHandler extends BaseSocketHandler<ParticipantProfilesEvent> {
  protected readonly eventName = "participant:profiles";
  protected readonly schema = participantProfilesSchema;

  protected handle(data: ParticipantProfilesEvent): void {
    this.logger.info("Received participant profiles", {
      count: data.profiles.length,
      userIds: data.profiles.map((p) => p.userId),
    });

    profileCache.getState().addMany(data.profiles);

    this.logger.debug("Profile cache updated", {
      totalProfiles: profileCache.getState().profiles.size,
    });
  }
}
