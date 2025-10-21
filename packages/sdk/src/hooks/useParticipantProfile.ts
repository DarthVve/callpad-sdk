import type { Nullable } from "../core";
import { useProfileCache } from "../state/profileCache";
import type { Profile } from "../state/types";

export function useParticipantProfile(userId: string): Nullable<Profile> {
  return useProfileCache((state) => {
    return state.profiles.get(userId) || null;
  });
}

export function useIsProfilePending(userId: string): boolean {
  return useProfileCache((state) => {
    if (!userId) {
      return false;
    }
    return state.pending.has(userId);
  });
}
