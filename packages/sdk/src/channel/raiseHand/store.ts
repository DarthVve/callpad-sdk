import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ParticipantMetadata } from "../../state/types";
import type { RaiseHandEnvelope, RaiseHandState, RaisedHand } from "./types";

interface RaiseHandActions {
  raiseHand: (participantId: string) => void;
  lowerHand: (participantId: string) => void;
  lowerAllHands: () => void;
  isHandRaised: (participantId: string) => boolean;
  getRaisedHandOrder: (participantId: string) => number | null;
  upsertParticipantInfo: (id: string, info: ParticipantMetadata) => void;
  clear: () => void;
}

const defaultState: RaiseHandState = {
  raisedHands: new Map(),
  nextOrder: 1,
};

export const useRaiseHandStore = create<RaiseHandState & RaiseHandActions>()(
  immer((set, get) => ({
    ...defaultState,

    raiseHand: (participantId) =>
      set((state) => {
        if (!state.raisedHands.has(participantId)) {
          state.raisedHands.set(participantId, {
            ts: Date.now(),
            order: state.nextOrder++,
          });
        }
      }),

    lowerHand: (participantId) =>
      set((state) => {
        state.raisedHands.delete(participantId);
        // Reset order counter when all hands are lowered
        if (state.raisedHands.size === 0) {
          state.nextOrder = 1;
        }
      }),

    lowerAllHands: () =>
      set((state) => {
        state.raisedHands.clear();
        state.nextOrder = 1;
      }),

    isHandRaised: (participantId) => get().raisedHands.has(participantId),

    getRaisedHandOrder: (participantId) => {
      const hand = get().raisedHands.get(participantId);
      return hand?.order ?? null;
    },

    upsertParticipantInfo: (id, info) => {
      // No-op for now, can be extended if needed
    },

    clear: () =>
      set(() => ({
        raisedHands: new Map(),
        nextOrder: 1,
      })),
  }))
);

export function applyIncomingRaiseHand(envelope: RaiseHandEnvelope): void {
  const { raiseHand, lowerHand, lowerAllHands, upsertParticipantInfo } =
    useRaiseHandStore.getState();

  if (envelope.sender.info) {
    upsertParticipantInfo(envelope.sender.id, envelope.sender.info);
  }

  switch (envelope.payload.action) {
    case "raise": {
      raiseHand(envelope.sender.id);
      break;
    }
    case "lower": {
      const targetId = envelope.payload.targetId || envelope.sender.id;
      lowerHand(targetId);
      break;
    }
    case "lower-all": {
      lowerAllHands();
      break;
    }
  }
}
