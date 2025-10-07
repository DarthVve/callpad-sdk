import { useState } from "react";
import type { MediaActions } from "../livekit";
import { useSdk } from "../provider/RtcProvider";
import { useRtcStore } from "../state/store";
import type { RtcError } from "../state/types";
import { createLogger } from "../utils/logger";
import { useDevices } from "./useDevices";

const logger = createLogger("hooks:media-controls");

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
  // Device switching
  switchCamera: (deviceId: string) => Promise<void>;
  switchMicrophone: (deviceId: string) => Promise<void>;
  // Simple aliases
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
}

export interface MediaControlsHook
  extends MediaControlsState,
    EnhancedMediaActions {}

export function useMediaControls(): MediaControlsHook & {
  devices: {
    cameras: any[];
    microphones: any[];
    speakers: any[];
  };
} {
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
  const devices = useDevices();

  const [isLoading, setIsLoading] = useState(false);

  // Get media controls directly - UI should only be available when connected
  const mediaControls = sdk.livekit?.media;

  // Enhanced wrapper functions with loading states and better error handling
  const createEnhancedAction = (
    action: () => Promise<void>,
    actionName: string
  ) => {
    return async (): Promise<void> => {
      setIsLoading(true);
      try {
        await action();
      } catch (error) {
        logger.error(`Failed to ${actionName}`, { actionName, error });
        throw error;
      } finally {
        setIsLoading(false);
      }
    };
  };

  // Fallback functions for when media controls are not available
  const unavailableAction = async (): Promise<void> => {
    throw new Error("Media controls not available");
  };

  // Simple device switching functions without complex error handling
  const switchCamera = async (deviceId: string): Promise<void> => {
    try {
      if (sdk.livekit?.devices) {
        await sdk.livekit.devices.switchCamera(deviceId);
      }
    } catch (error) {
      logger.error("Failed to switch camera", { error, deviceId });
      throw error;
    }
  };

  const switchMicrophone = async (deviceId: string): Promise<void> => {
    try {
      if (sdk.livekit?.devices) {
        await sdk.livekit.devices.switchMicrophone(deviceId);
      }
    } catch (error) {
      logger.error("Failed to switch microphone", { error, deviceId });
      throw error;
    }
  };

  const actions: EnhancedMediaActions = mediaControls
    ? {
        enableCamera: createEnhancedAction(
          () => mediaControls!.enableCamera(),
          "enable camera"
        ),
        disableCamera: createEnhancedAction(
          () => mediaControls!.disableCamera(),
          "disable camera"
        ),
        enableMicrophone: createEnhancedAction(
          () => mediaControls!.enableMicrophone(),
          "enable microphone"
        ),
        disableMicrophone: createEnhancedAction(
          () => mediaControls!.disableMicrophone(),
          "disable microphone"
        ),
        toggleCamera: createEnhancedAction(
          () => mediaControls!.toggleCamera(),
          "toggle camera"
        ),
        toggleMicrophone: createEnhancedAction(
          () => mediaControls!.toggleMicrophone(),
          "toggle microphone"
        ),
        // Device switching
        switchCamera,
        switchMicrophone,
        // Simple aliases
        toggleAudio: createEnhancedAction(
          () => mediaControls!.toggleMicrophone(),
          "toggle audio"
        ),
        toggleVideo: createEnhancedAction(
          () => mediaControls!.toggleCamera(),
          "toggle video"
        ),
      }
    : {
        enableCamera: unavailableAction,
        disableCamera: unavailableAction,
        enableMicrophone: unavailableAction,
        disableMicrophone: unavailableAction,
        toggleCamera: unavailableAction,
        toggleMicrophone: unavailableAction,
        switchCamera: unavailableAction,
        switchMicrophone: unavailableAction,
        toggleAudio: unavailableAction,
        toggleVideo: unavailableAction,
      };

  return {
    // State
    isVideoEnabled: local.videoEnabled,
    isAudioEnabled: local.audioEnabled,
    isCameraAvailable: !!mediaControls,
    isMicrophoneAvailable: !!mediaControls,
    isConnected: connection.connected,
    isLoading,
    errors,

    // Device access
    devices: {
      cameras: devices.cams,
      microphones: devices.mics,
      speakers: devices.speakers,
    },

    // Enhanced Actions
    enableCamera: actions.enableCamera,
    disableCamera: actions.disableCamera,
    enableMicrophone: actions.enableMicrophone,
    disableMicrophone: actions.disableMicrophone,
    toggleCamera: actions.toggleCamera,
    toggleMicrophone: actions.toggleMicrophone,
    // Device switching
    switchCamera: actions.switchCamera,
    switchMicrophone: actions.switchMicrophone,
    // Simple aliases
    toggleAudio: actions.toggleAudio,
    toggleVideo: actions.toggleVideo,
  };
}