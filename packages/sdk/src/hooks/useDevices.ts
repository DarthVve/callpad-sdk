import { Room } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import { useSdk } from "../provider/RtcProvider";
import { useRtcStore } from "../state/store";
import type { DeviceState, PermissionStatus, RtcError } from "../state/types";

export interface DeviceActions {
  switchCamera: (deviceId: string) => Promise<void>;
  switchMicrophone: (deviceId: string) => Promise<void>;
  switchSpeaker: (deviceId: string) => Promise<void>;
  listDevices: () => Promise<void>;
  refreshDevices: () => Promise<void>;
  requestPermissions: (kind: "microphone" | "camera" | "both") => Promise<void>;
  checkPermissions: () => Promise<void>;
}

export interface DevicesHook extends DeviceState, DeviceActions {
  isConnected: boolean;
  errors: RtcError[];
}

export function useDevices(): DevicesHook {
  const sdk = useSdk();
  const devices = useRtcStore((state) => state.devices);
  const connection = useRtcStore((state) => state.connection);
  const errors = useRtcStore((state) =>
    state.errors.filter((e) => e.code.startsWith("DEVICE_"))
  );

  const [localLoading, setLocalLoading] = useState(false);

  const isConnected = connection.connected;
  let deviceManager = null;

  try {
    if (sdk.livekit && isConnected) {
      deviceManager = sdk.livekit.devices;
    }
  } catch {
    deviceManager = null;
  }

  const createSwitchAction = useCallback(
    (
      switchFn: (deviceId: string) => Promise<void> | undefined,
      actionName: string
    ) => {
      return async (deviceId: string): Promise<void> => {
        if (!deviceManager) {
          const errorMsg = !isConnected
            ? "Cannot switch device - not connected to LiveKit room"
            : "Device manager not available - LiveKit service not initialized";
          throw new Error(errorMsg);
        }

        setLocalLoading(true);
        try {
          const result = switchFn(deviceId);
          if (result) {
            await result;
          }
        } catch (error) {
          console.error(`Failed to ${actionName}:`, error);
          throw error;
        } finally {
          setLocalLoading(false);
        }
      };
    },
    [deviceManager, isConnected]
  );

  const switchCamera = createSwitchAction(
    (deviceId: string) => deviceManager?.switchCamera(deviceId),
    "switch camera"
  );

  const switchMicrophone = createSwitchAction(
    (deviceId: string) => deviceManager?.switchMicrophone(deviceId),
    "switch microphone"
  );

  const switchSpeaker = createSwitchAction(
    (deviceId: string) => deviceManager?.switchSpeaker(deviceId),
    "switch speaker"
  );

  // Pre-connection device listing using LiveKit static method
  const listDevices = useCallback(async (): Promise<void> => {
    setLocalLoading(true);
    try {
      const [mics, cams, speakers] = await Promise.all([
        Room.getLocalDevices("audioinput", false), // Don't request permissions
        Room.getLocalDevices("videoinput", false),
        Room.getLocalDevices("audiooutput", false),
      ]);

      useRtcStore.getState().patch((state) => {
        state.devices.mics = mics;
        state.devices.cams = cams;
        state.devices.speakers = speakers;
        state.devices.isEnumerating = false;
        state.devices.lastEnumeratedAt = Date.now();
      });
    } catch (error) {
      console.error("Failed to list devices:", error);
      throw error;
    } finally {
      setLocalLoading(false);
    }
  }, []);

  // Request permissions and refresh device labels
  const requestPermissions = useCallback(
    async (kind: "microphone" | "camera" | "both"): Promise<void> => {
      setLocalLoading(true);
      try {
        // Use LiveKit's permission-requesting device enumeration
        if (kind === "microphone" || kind === "both") {
          await Room.getLocalDevices("audioinput", true); // Request permissions
          useRtcStore.getState().patch((state) => {
            state.devices.permissions.microphone = "granted";
          });
        }

        if (kind === "camera" || kind === "both") {
          await Room.getLocalDevices("videoinput", true); // Request permissions
          useRtcStore.getState().patch((state) => {
            state.devices.permissions.camera = "granted";
          });
        }

        // Refresh all devices to get updated labels
        await listDevices();
      } catch (error) {
        console.error("Failed to request permissions:", error);

        // Update permission state based on error type
        useRtcStore.getState().patch((state) => {
          if (kind === "microphone" || kind === "both") {
            state.devices.permissions.microphone = "denied";
          }
          if (kind === "camera" || kind === "both") {
            state.devices.permissions.camera = "denied";
          }
        });

        throw error;
      } finally {
        setLocalLoading(false);
      }
    },
    [listDevices]
  );

  const refreshDevices = useCallback(async (): Promise<void> => {
    if (deviceManager && isConnected) {
      // Use connected device manager when available
      setLocalLoading(true);
      try {
        await deviceManager.enumerateDevices();
      } catch (error) {
        console.error("Failed to refresh devices:", error);
        throw error;
      } finally {
        setLocalLoading(false);
      }
    } else {
      // Fall back to pre-connection listing
      await listDevices();
    }
  }, [deviceManager, isConnected, listDevices]);

  const checkPermissions = useCallback(async (): Promise<void> => {
    if (!navigator.permissions) {
      return;
    }

    try {
      const [cameraPermission, microphonePermission] = await Promise.all([
        navigator.permissions.query({ name: "camera" as PermissionName }),
        navigator.permissions.query({ name: "microphone" as PermissionName }),
      ]);

      useRtcStore.getState().patch((state) => {
        state.devices.permissions.camera =
          cameraPermission.state as PermissionStatus;
        state.devices.permissions.microphone =
          microphonePermission.state as PermissionStatus;
      });

      cameraPermission.onchange = () => {
        useRtcStore.getState().patch((state) => {
          state.devices.permissions.camera =
            cameraPermission.state as PermissionStatus;
        });
      };

      microphonePermission.onchange = () => {
        useRtcStore.getState().patch((state) => {
          state.devices.permissions.microphone =
            microphonePermission.state as PermissionStatus;
        });
      };
    } catch (error) {
      console.warn("Failed to check device permissions:", error);
      useRtcStore.getState().patch((state) => {
        state.devices.permissions.camera = "unknown";
        state.devices.permissions.microphone = "unknown";
      });
    }
  }, []);

  useEffect(() => {
    // Auto-list devices on mount (works pre-connection)
    listDevices().catch((error) => {
      console.warn("Failed to auto-list devices:", error);
    });

    checkPermissions().catch((error) => {
      console.warn("Failed to check permissions:", error);
    });
  }, [listDevices, checkPermissions]);

  useEffect(() => {
    // Re-enumerate when connected to get more accurate device info
    if (isConnected && deviceManager) {
      refreshDevices().catch((error) => {
        console.warn("Failed to refresh devices after connection:", error);
      });
    }
  }, [isConnected, deviceManager, refreshDevices]);

  const unavailableAction = async (): Promise<void> => {
    const errorMsg = !isConnected
      ? "Cannot perform device operation - not connected to LiveKit room"
      : "Device manager not available - LiveKit service not initialized";
    throw new Error(errorMsg);
  };

  const isEnumerating = devices.isEnumerating || localLoading;

  return {
    mics: devices.mics,
    cams: devices.cams,
    speakers: devices.speakers,
    selected: devices.selected,
    permissions: devices.permissions,
    isEnumerating,
    lastEnumeratedAt: devices.lastEnumeratedAt,

    isConnected,
    errors,

    switchCamera: deviceManager ? switchCamera : unavailableAction,
    switchMicrophone: deviceManager ? switchMicrophone : unavailableAction,
    switchSpeaker: deviceManager ? switchSpeaker : unavailableAction,
    listDevices, // Always available (works pre-connection)
    refreshDevices, // Now works both pre and post connection
    requestPermissions, // Always available (works pre-connection)
    checkPermissions,
  };
}

export function useDeviceState(): DeviceState {
  return useRtcStore((state) => state.devices);
}

export function useDevicePermissions(): {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  isPermissionGranted: (type: "camera" | "microphone") => boolean;
  hasAnyPermission: boolean;
} {
  const permissions = useRtcStore((state) => state.devices.permissions);

  const isPermissionGranted = useCallback(
    (type: "camera" | "microphone"): boolean => {
      return permissions[type] === "granted";
    },
    [permissions]
  );

  const hasAnyPermission =
    permissions.camera === "granted" || permissions.microphone === "granted";

  return {
    camera: permissions.camera,
    microphone: permissions.microphone,
    isPermissionGranted,
    hasAnyPermission,
  };
}
