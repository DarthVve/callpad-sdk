import { useRecordingStore } from "../state/recording.store";
import type { RecordingInfo } from "../state/types";

/**
 * Hook to access recording state
 * 
 * @returns Recording state and helper functions
 * 
 * @example
 * ```tsx
 * function RecordingIndicator() {
 *   const { isRecording, recording } = useRecording();
 *   
 *   if (!isRecording) return null;
 *   
 *   return <div>Recording: {recording?.recordingId}</div>;
 * }
 * ```
 */
export function useRecording(): {
  isRecording: boolean;
  recording: RecordingInfo | null;
} {
  const isRecording = useRecordingStore((state) => state.isRecording);
  const recording = useRecordingStore((state) => state.recording);

  return {
    isRecording,
    recording,
  };
}

