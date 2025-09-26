import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { RtcError, RtcState } from "./types";
import { defaultState } from "./types";

type Actions = {
  patch: (fn: (draft: RtcState) => void) => void;
  reset: () => void;
  addError: (error: RtcError) => void;
  clearErrors: () => void;
};

export const useRtcStore = create<RtcState & Actions>()(
  immer((set) => ({
    ...defaultState,

    patch: (fn) =>
      set((state) => {
        fn(state);
      }),

    reset: () => set(() => defaultState),

    addError: (error) =>
      set((state) => {
        state.errors.push(error);
      }),

    clearErrors: () =>
      set((state) => {
        state.errors = [];
      }),
  }))
);

// Vanilla store for non-React contexts
export const rtcStore = useRtcStore;
