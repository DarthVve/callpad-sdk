import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ParticipantMetadata } from "../../state/types";
import type { SpotlightEnvelope, SpotlightState, SpotlightedUser } from "./types";

interface SpotlightActions {
  spotlight: (participantId: string, info?: ParticipantMetadata) => void;
  unspotlight: () => void;
  getSpotlightedUser: () => SpotlightedUser | null;
  isSpotlighted: (participantId: string) => boolean;
  clear: () => void;
}

const defaultState: SpotlightState = {
  spotlightedUser: null,
};

export const useSpotlightStore = create<SpotlightState & SpotlightActions>()(
  immer((set, get) => ({
    ...defaultState,

    spotlight: (participantId, info) =>
      set((state) => {
        state.spotlightedUser = {
          participantId,
          ts: Date.now(),
          ...(info && { info }),
        };
      }),

    unspotlight: () =>
      set((state) => {
        state.spotlightedUser = null;
      }),

    getSpotlightedUser: () => get().spotlightedUser,

    isSpotlighted: (participantId) => {
      const user = get().spotlightedUser;
      return user?.participantId === participantId;
    },

    clear: () =>
      set(() => ({
        spotlightedUser: null,
      })),
  }))
);

export function applyIncomingSpotlight(envelope: SpotlightEnvelope): void {
  const { spotlight, unspotlight } = useSpotlightStore.getState();

  switch (envelope.payload.action) {
    case "spotlight": {
      // Note: We don't have the target's info in the envelope, only the sender's
      // The info can be populated later if needed from the room's participant list
      spotlight(envelope.payload.targetId);
      break;
    }
    case "unspotlight": {
      unspotlight();
      break;
    }
  }
}

