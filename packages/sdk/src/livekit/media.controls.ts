import type { LocalParticipant } from "livekit-client";
import { rtcStore } from "../state/store";
import { classifyMediaError } from "./error-classifier";
import type { MediaActions } from "./types";

export class MediaControls implements MediaActions {
  constructor(private localParticipant: LocalParticipant) {}

  private async executeWithOptimisticUpdate<T>(
    stateUpdate: (enabled: boolean) => void,
    operation: () => Promise<T>,
    device: string,
    getLastError: () => Error | undefined,
    newValue: boolean
  ): Promise<T> {
    const originalValue = !newValue;

    // Optimistic update
    stateUpdate(newValue);

    try {
      return await operation();
    } catch (error) {
      // Revert on error
      stateUpdate(originalValue);
      this.handleMediaError(device, error, getLastError());
      throw error;
    }
  }

  async enableCamera(): Promise<void> {
    await this.executeWithOptimisticUpdate(
      (enabled) =>
        rtcStore.getState().patch((state) => {
          state.local.videoEnabled = enabled;
        }),
      () => this.localParticipant.setCameraEnabled(true),
      "camera",
      () => this.localParticipant.lastCameraError,
      true
    );
  }

  async disableCamera(): Promise<void> {
    await this.executeWithOptimisticUpdate(
      (enabled) =>
        rtcStore.getState().patch((state) => {
          state.local.videoEnabled = enabled;
        }),
      () => this.localParticipant.setCameraEnabled(false),
      "camera",
      () => this.localParticipant.lastCameraError,
      false
    );
  }

  async enableMicrophone(): Promise<void> {
    await this.executeWithOptimisticUpdate(
      (enabled) =>
        rtcStore.getState().patch((state) => {
          state.local.audioEnabled = enabled;
        }),
      () => this.localParticipant.setMicrophoneEnabled(true),
      "microphone",
      () => this.localParticipant.lastMicrophoneError,
      true
    );
  }

  async disableMicrophone(): Promise<void> {
    await this.executeWithOptimisticUpdate(
      (enabled) =>
        rtcStore.getState().patch((state) => {
          state.local.audioEnabled = enabled;
        }),
      () => this.localParticipant.setMicrophoneEnabled(false),
      "microphone",
      () => this.localParticipant.lastMicrophoneError,
      false
    );
  }

  async toggleCamera(): Promise<void> {
    const currentState = rtcStore.getState().local.videoEnabled;
    if (currentState) {
      await this.disableCamera();
    } else {
      await this.enableCamera();
    }
  }

  async toggleMicrophone(): Promise<void> {
    const currentState = rtcStore.getState().local.audioEnabled;
    if (currentState) {
      await this.disableMicrophone();
    } else {
      await this.enableMicrophone();
    }
  }

  private handleMediaError(
    device: string,
    error: unknown,
    livekitError?: Error
  ): void {
    const mediaError = classifyMediaError(error, device, livekitError);

    rtcStore.getState().addError({
      code: mediaError.code,
      message: mediaError.message,
      timestamp: Date.now(),
      context: {
        originalError: error,
        livekitError,
        device,
        category: mediaError.category,
        recoverable: mediaError.recoverable,
        mediaError,
      },
    });
  }
}
