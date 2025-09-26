import { useState } from "react";
import type { MediaActions } from "../livekit";
import { useSdk } from "../provider/RtcProvider";
import { useRtcStore } from "../state/store";
import type { RtcError } from "../state/types";

export interface MediaControlsState {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isCameraAvailable: boolean;
  isMicrophoneAvailable: boolean;
  isConnected: boolean;
  isLoading: boolean;
  errors: RtcError[];
}

export interface EnhancedMediaActions {
  enableCamera: () => Promise<void>;
  disableCamera: () => Promise<void>;
  enableMicrophone: () => Promise<void>;
  disableMicrophone: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
}

export interface MediaControlsHook
  extends MediaControlsState,
    EnhancedMediaActions {}

export function useMediaControls(): MediaControlsHook {
  const sdk = useSdk();
  const local = useRtcStore((state) => state.local);
  const connection = useRtcStore((state) => state.connection);
  const errors = useRtcStore((state) =>
    state.errors.filter(
      (e) =>
        e.code.startsWith("CAMERA_") ||
        e.code.startsWith("MICROPHONE_") ||
        e.code.startsWith("LIVEKIT_")
    )
  );

  const [isLoading, setIsLoading] = useState(false);

  // Check if media controls are available and connected
  const isConnected = connection.connected;
  let mediaControls: MediaActions | null = null;

  try {
    if (sdk.livekit && isConnected) {
      mediaControls = sdk.livekit.media;
    }
  } catch {
    // Media controls not available - room not connected
    mediaControls = null;
  }

  // Enhanced wrapper functions with loading states and better error handling
  const createEnhancedAction = (
    action: () => Promise<void>,
    actionName: string
  ) => {
    return async (): Promise<void> => {
      if (!mediaControls) {
        const errorMsg = !isConnected
          ? "Cannot control media - not connected to LiveKit room"
          : "Media controls not available - LiveKit service not initialized";
        throw new Error(errorMsg);
      }

      setIsLoading(true);
      try {
        await action();
      } catch (error) {
        // Enhanced error handling with context
        console.error(`Failed to ${actionName}:`, error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    };
  };

  // Fallback functions for when media controls are not available
  const unavailableAction = async (): Promise<void> => {
    const errorMsg = !isConnected
      ? "Cannot control media - not connected to LiveKit room"
      : "Media controls not available - LiveKit service not initialized";
    throw new Error(errorMsg);
  };

  const actions: EnhancedMediaActions = mediaControls
    ? {
        enableCamera: createEnhancedAction(
          () => mediaControls?.enableCamera(),
          "enable camera"
        ),
        disableCamera: createEnhancedAction(
          () => mediaControls?.disableCamera(),
          "disable camera"
        ),
        enableMicrophone: createEnhancedAction(
          () => mediaControls?.enableMicrophone(),
          "enable microphone"
        ),
        disableMicrophone: createEnhancedAction(
          () => mediaControls?.disableMicrophone(),
          "disable microphone"
        ),
        toggleCamera: createEnhancedAction(
          () => mediaControls?.toggleCamera(),
          "toggle camera"
        ),
        toggleMicrophone: createEnhancedAction(
          () => mediaControls?.toggleMicrophone(),
          "toggle microphone"
        ),
      }
    : {
        enableCamera: unavailableAction,
        disableCamera: unavailableAction,
        enableMicrophone: unavailableAction,
        disableMicrophone: unavailableAction,
        toggleCamera: unavailableAction,
        toggleMicrophone: unavailableAction,
      };

  return {
    // State
    isVideoEnabled: local.videoEnabled,
    isAudioEnabled: local.audioEnabled,
    isCameraAvailable: !!mediaControls,
    isMicrophoneAvailable: !!mediaControls,
    isConnected,
    isLoading,
    errors,

    // Enhanced Actions
    enableCamera: actions.enableCamera,
    disableCamera: actions.disableCamera,
    enableMicrophone: actions.enableMicrophone,
    disableMicrophone: actions.disableMicrophone,
    toggleCamera: actions.toggleCamera,
    toggleMicrophone: actions.toggleMicrophone,
  };
}
