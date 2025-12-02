import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ParticipantMetadata } from "../../state/types";
import type { SpotlightEnvelope, SpotlightState, SpotlightedUser } from "./types";

interface SpotlightActions {
  spotlight: (participantId: string, info?: ParticipantMetadata) => void;
  unspotlight: () => void;
  getSpotlightedUser: () => SpotlightedUser | null;
  clear: () => void;
}

const defaultState: SpotlightState = {
  spotlightedUser: null,
  isSpotlighted: false,
};

export const useSpotlightStore = create<
  SpotlightState & SpotlightActions
>()(
  immer((set, get) => ({
    ...defaultState,

    spotlight: (participantId, info) =>
      set((state) => {
        state.spotlightedUser = {
          participantId,
          ts: Date.now(),
          ...(info && { info }),
        };
        state.isSpotlighted = true;
      }),

    unspotlight: () =>
      set((state) => {
        state.spotlightedUser = null;
        state.isSpotlighted = false;
      }),

    getSpotlightedUser: () => get().spotlightedUser,

    clear: () =>
      set(() => ({
        spotlightedUser: null,
        isSpotlighted: false,
      })),
  }))
);

export function applyIncomingSpotlight(envelope: SpotlightEnvelope): void {
  const { spotlight, unspotlight } = useSpotlightStore.getState();

  switch (envelope.payload.action) {
    case "spotlight": {
      // Note: We don't have the target's info in the envelope, only the sender's
      // The info can be populated later if needed from the room's participant list
      spotlight(envelope.payload.targetId, envelope.payload.info);
      break;
    }
    case "unspotlight": {
      unspotlight();
      break;
    }
  }
}

