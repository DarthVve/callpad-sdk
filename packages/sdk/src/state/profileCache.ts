import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Profile } from "./types";

interface ProfileCacheState {
  profiles: Map<string, Profile>;
  pending: Set<string>;
}

interface ProfileCacheActions {
  addMany: (profiles: Profile[]) => void;
  get: (userId: string) => Profile | undefined;
  getMany: (userIds: string[]) => (Profile | undefined)[];
  markPending: (userIds: string[]) => void;
  clear: () => void;
}

const initialState: ProfileCacheState = {
  profiles: new Map(),
  pending: new Set(),
};

export const useProfileCache = create<ProfileCacheState & ProfileCacheActions>()(
  immer((set, get) => ({
    ...initialState,

    addMany: (profiles) =>
      set((state) => {
        for (const profile of profiles) {
          state.profiles.set(profile.userId, profile);
          state.pending.delete(profile.userId);
        }
      }),

    get: (userId) => {
      return get().profiles.get(userId);
    },

    getMany: (userIds) => {
      const { profiles } = get();
      return userIds.map((userId) => profiles.get(userId));
    },

    markPending: (userIds) =>
      set((state) => {
        for (const userId of userIds) {
          if (!state.profiles.has(userId)) {
            state.pending.add(userId);
          }
        }
      }),

    clear: () =>
      set((state) => {
        state.profiles.clear();
        state.pending.clear();
      }),
  }))
);

export const profileCache = useProfileCache;
