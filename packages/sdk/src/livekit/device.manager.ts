import { ConnectionState, Room, RoomEvent, Track } from "livekit-client";
import { rtcStore } from "../state/store";
import { classifyMediaError } from "./error-classifier";

export class DeviceManager {
  private cleanupFunctions: Array<() => void> = [];

  constructor(private room: Room) {
    this.setupDeviceEventListeners();
  }

  async enumerateDevices(): Promise<void> {
    try {
      const [cameras, microphones, speakers] = await Promise.all([
        Room.getLocalDevices("videoinput"),
        Room.getLocalDevices("audioinput"),
        Room.getLocalDevices("audiooutput"),
      ]);

      rtcStore.getState().patch((state) => {
        state.devices.cams = cameras;
        state.devices.mics = microphones;
        state.devices.speakers = speakers;
      });
    } catch (error) {
      this.handleDeviceError("enumerate", error);
      throw error;
    }
  }

  async switchCamera(deviceId: string): Promise<void> {
    if (this.room.state !== ConnectionState.Connected) {
      throw new Error("Cannot switch camera - room not connected");
    }

    try {
      await this.room.switchActiveDevice("videoinput", deviceId);

      // Update selected device in state
      rtcStore.getState().patch((state) => {
        state.devices.selected.camId = deviceId;
      });
    } catch (error) {
      // LiveKit automatically populates lastCameraError
      const livekitError = this.room.localParticipant.lastCameraError;
      this.handleDeviceError("camera", error, livekitError);
      throw error;
    }
  }

  async switchMicrophone(deviceId: string): Promise<void> {
    if (this.room.state !== ConnectionState.Connected) {
      throw new Error("Cannot switch microphone - room not connected");
    }

    try {
      await this.room.switchActiveDevice("audioinput", deviceId);

      // Update selected device in state
      rtcStore.getState().patch((state) => {
        state.devices.selected.micId = deviceId;
      });
    } catch (error) {
      // LiveKit automatically populates lastMicrophoneError
      const livekitError = this.room.localParticipant.lastMicrophoneError;
      this.handleDeviceError("microphone", error, livekitError);
      throw error;
    }
  }

  async switchSpeaker(deviceId: string): Promise<void> {
    if (this.room.state !== ConnectionState.Connected) {
      throw new Error("Cannot switch speaker - room not connected");
    }

    try {
      await this.room.switchActiveDevice("audiooutput", deviceId);

      // Update selected device in state
      rtcStore.getState().patch((state) => {
        state.devices.selected.speakerId = deviceId;
      });
    } catch (error) {
      // Note: speakers don't have a specific lastError in LiveKit
      this.handleDeviceError("speaker", error);
      throw error;
    }
  }

  async getCurrentDeviceSelection(): Promise<{
    camera: string | undefined;
    microphone: string | undefined;
    speaker: string | undefined;
  }> {
    const videoTrack = this.room.localParticipant.getTrackPublication(
      Track.Source.Camera
    )?.track;
    const audioTrack = this.room.localParticipant.getTrackPublication(
      Track.Source.Microphone
    )?.track;

    const [cameraDeviceId, microphoneDeviceId] = await Promise.all([
      videoTrack ? videoTrack.getDeviceId() : Promise.resolve(undefined),
      audioTrack ? audioTrack.getDeviceId() : Promise.resolve(undefined),
    ]);

    return {
      camera: cameraDeviceId || undefined,
      microphone: microphoneDeviceId || undefined,
      // Speaker device ID is not directly accessible from tracks
      speaker: rtcStore.getState().devices.selected.speakerId || undefined,
    };
  }

  private setupDeviceEventListeners(): void {
    const handleDevicesChanged = () => {
      // Refresh the device list when devices are added/removed
      this.enumerateDevices().catch(() => {
        // Silently handle refresh errors
      });
    };

    // Listen for device errors
    const handleDeviceError = (error: any) => {
      this.handleDeviceError("device_event", error);
    };

    if ("MediaDevicesChanged" in RoomEvent) {
      this.room.on(RoomEvent.MediaDevicesChanged, handleDevicesChanged);
    }
    if ("MediaDevicesError" in RoomEvent) {
      this.room.on(RoomEvent.MediaDevicesError, handleDeviceError);
    }

    this.cleanupFunctions.push(() => {
      if ("MediaDevicesChanged" in RoomEvent) {
        this.room.off(RoomEvent.MediaDevicesChanged, handleDevicesChanged);
      }
      if ("MediaDevicesError" in RoomEvent) {
        this.room.off(RoomEvent.MediaDevicesError, handleDeviceError);
      }
    });
  }

  private handleDeviceError(
    operation: string,
    error: unknown,
    livekitError?: Error
  ): void {
    const mediaError = classifyMediaError(error, operation, livekitError);
    rtcStore.getState().addError({
      code: mediaError.code,
      message: mediaError.message,
      timestamp: Date.now(),
      context: {
        operation,
        category: mediaError.category,
        recoverable: mediaError.recoverable,
        device: mediaError.device,
        originalError: error,
        livekitError,
      },
    });
  }

  destroy(): void {
    for (const cleanup of this.cleanupFunctions) {
      cleanup();
    }
    this.cleanupFunctions = [];
  }
}
