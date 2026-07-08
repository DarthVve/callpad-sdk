import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ParticipantListState {
  pinnedParticipantIds: Set<string>;
}

interface ParticipantListActions {
  togglePin: (participantId: string) => void;
  clearPinned: () => void;
  isPinned: (participantId: string) => boolean;
}

const defaultState: ParticipantListState = {
  pinnedParticipantIds: new Set(),
};

export const useParticipantListStore = create<
  ParticipantListState & ParticipantListActions
>()(
  immer((set, get) => ({
    ...defaultState,

    togglePin: (participantId) =>
      set((state) => {
        if (state.pinnedParticipantIds.has(participantId)) {
          state.pinnedParticipantIds.delete(participantId);
        } else {
          state.pinnedParticipantIds.add(participantId);
        }
      }),

    clearPinned: () =>
      set((state) => {
        state.pinnedParticipantIds.clear();
      }),

    isPinned: (participantId) => get().pinnedParticipantIds.has(participantId),
  }))
);
