import { enableMapSet } from "immer";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { UserPresence } from "./presence.types";

enableMapSet();

interface PresenceStoreState {
  presence: Map<string, UserPresence>;
}

interface PresenceStoreActions {
  updateMany: (presences: UserPresence[]) => void;
  get: (userId: string) => UserPresence | undefined;
  isStale: (userId: string, cacheTtlMs: number) => boolean;
  clear: () => void;
}

const initialState: PresenceStoreState = {
  presence: new Map(),
};

export const usePresenceStore = create<
  PresenceStoreState & PresenceStoreActions
>()(
  immer((set, get) => ({
    ...initialState,

    updateMany: (presences) =>
      set((state) => {
        const now = Date.now();
        for (const p of presences) {
          state.presence.set(p.userId, { ...p, lastUpdated: now });
        }
      }),

    get: (userId) => get().presence.get(userId),

    isStale: (userId, cacheTtlMs) => {
      const entry = get().presence.get(userId);
      if (!entry) return true;
      return Date.now() - entry.lastUpdated > cacheTtlMs;
    },

    clear: () =>
      set((state) => {
        state.presence.clear();
      }),
  }))
);

export const presenceStore = usePresenceStore;
