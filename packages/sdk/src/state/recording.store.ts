import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { RecordingInfo } from "./types";

interface RecordingState {
  recording: RecordingInfo | null;
  isRecording: boolean;
}

interface RecordingActions {
  setRecording: (recording: RecordingInfo | null) => void;
  clear: () => void;
}

const defaultState: RecordingState = {
  recording: null,
  isRecording: false,
};

export const useRecordingStore = create<RecordingState & RecordingActions>()(
  immer((set) => ({
    ...defaultState,

    setRecording: (recording) =>
      set((state) => {
        state.recording = recording;
        state.isRecording = recording !== null;
      }),

    clear: () =>
      set(() => ({
        recording: null,
        isRecording: false,
      })),
  }))
);

export const recordingStore = useRecordingStore;

