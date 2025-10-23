import { enableMapSet } from "immer";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { SignalUsersService } from "../clients/signal/services/users";
import type { Profile } from "./types";

enableMapSet();

interface ProfileCacheState {
  profiles: Map<string, Profile>;
  pending: Set<string>;
  inFlight: Map<string, Promise<Profile | undefined>>;
  usersService?: SignalUsersService;
}

interface ProfileCacheActions {
  addMany: (profiles: Profile[]) => void;
  get: (userId: string) => Profile | undefined;
  getMany: (userIds: string[]) => (Profile | undefined)[];
  markPending: (userIds: string[]) => void;
  clear: () => void;
  configure: (appId: string) => void;
  getOrFetch: (userId: string) => Promise<Profile | undefined>;
}

const initialState: ProfileCacheState = {
  profiles: new Map(),
  pending: new Set(),
  inFlight: new Map(),
};

export const useProfileCache = create<
  ProfileCacheState & ProfileCacheActions
>()(
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
        state.inFlight.clear();
      }),

    configure: (appId) =>
      set((state) => {
        state.usersService = new SignalUsersService(appId);
      }),

    getOrFetch: async (userId) => {
      const { profiles, inFlight, usersService } = get();
      if (!userId) return undefined;

      const cached = profiles.get(userId);
      if (cached) return cached;

      const existing = inFlight.get(userId);
      if (existing) return existing;

      if (!usersService) {
        console.warn("profileCache not configured; cannot fetch profile");
        return undefined;
      }

      const fetchPromise = (async () => {
        set((state) => {
          state.pending.add(userId);
        });

        try {
          const response = await usersService.getById({ id: userId });

          const profile: Profile = {
            userId: response.userId,
            username: response.username,
            firstName: response.firstName,
            lastName: response.lastName,
            profilePhoto: response.profilePhoto,
          };

          get().addMany([profile]);
          return profile;
        } catch (error) {
          console.warn(`Failed to fetch profile for userId: ${userId}`, error);
          return undefined;
        } finally {
          set((state) => {
            state.inFlight.delete(userId);
            state.pending.delete(userId);
          });
        }
      })();

      set((state) => {
        state.inFlight.set(userId, fetchPromise);
      });

      return fetchPromise;
    },
  }))
);

export const profileCache = useProfileCache;
