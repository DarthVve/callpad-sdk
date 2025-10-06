import type {
  LocalParticipant,
  LocalTrackPublication,
  Room,
} from "livekit-client";
import { ConnectionState, Track } from "livekit-client";
import { rtcStore } from "../state/store";
import { SCREEN_SHARE_CONFIG } from "./constants";
import { classifyMediaError } from "./error-classifier";
import type { MediaActions } from "./types";

export class MediaControls implements MediaActions {
  constructor(
    private localParticipant: LocalParticipant,
    private room: Room
  ) {}

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
    if (this.room.state !== ConnectionState.Connected) {
      throw new Error("Cannot enable camera - room not connected");
    }

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
    if (this.room.state !== ConnectionState.Connected) {
      throw new Error("Cannot disable camera - room not connected");
    }

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
    if (this.room.state !== ConnectionState.Connected) {
      throw new Error("Cannot enable microphone - room not connected");
    }

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
    if (this.room.state !== ConnectionState.Connected) {
      throw new Error("Cannot disable microphone - room not connected");
    }

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

  async enableScreenShare(): Promise<void> {
    if (this.room.state !== ConnectionState.Connected) {
      throw new Error("Cannot enable screen share - room not connected");
    }

    const currentScreenShare = this.localParticipant.getTrackPublication(
      Track.Source.ScreenShare
    );
    if (currentScreenShare && !currentScreenShare.isMuted) {
      throw new Error("Screen share is already enabled");
    }

    try {
      // Optimistic update
      rtcStore.getState().patch((state) => {
        state.local.screenEnabled = true;
      });

      await this.localParticipant.setScreenShareEnabled(
        true,
        SCREEN_SHARE_CONFIG
      );
    } catch (error) {
      // Revert on error
      rtcStore.getState().patch((state) => {
        state.local.screenEnabled = false;
      });

      this.handleMediaError("screen_share", error);
      throw error;
    }
  }

  async disableScreenShare(): Promise<void> {
    if (this.room.state !== ConnectionState.Connected) {
      throw new Error("Cannot disable screen share - room not connected");
    }

    try {
      // Optimistic update
      rtcStore.getState().patch((state) => {
        state.local.screenEnabled = false;
      });

      await this.localParticipant.setScreenShareEnabled(false);
    } catch (error) {
      // Revert on error
      rtcStore.getState().patch((state) => {
        state.local.screenEnabled = true;
      });

      this.handleMediaError("screen_share", error);
      throw error;
    }
  }

  async toggleScreenShare(): Promise<void> {
    const currentState = rtcStore.getState().local.screenEnabled;
    if (currentState) {
      await this.disableScreenShare();
    } else {
      await this.enableScreenShare();
    }
  }

  /**
   * Get the current screen share track publication
   */
  getScreenSharePublication(): LocalTrackPublication | undefined {
    return this.localParticipant.getTrackPublication(Track.Source.ScreenShare);
  }

  /**
   * Check if screen share is currently active
   */
  isScreenShareActive(): boolean {
    const publication = this.getScreenSharePublication();
    return publication
      ? !publication.isMuted && publication.track !== undefined
      : false;
  }

  private handleMediaError(
    device: string,
    error: unknown,
    livekitError?: Error
  ): void {
    // For screen share, we might want different error handling
    if (device === "screen_share") {
      // Screen share has unique error patterns
      const errorMessage =
        error instanceof Error ? error.message.toLowerCase() : "";

      if (
        errorMessage.includes("permission") ||
        errorMessage.includes("denied")
      ) {
        rtcStore.getState().addError({
          code: "SCREEN_SHARE_PERMISSION_DENIED",
          message: "Screen share permission denied",
          timestamp: Date.now(),
          context: {
            originalError: error,
            device,
            category: "permission" as const,
            recoverable: true,
          },
        });
        return;
      }

      if (errorMessage.includes("not supported")) {
        rtcStore.getState().addError({
          code: "SCREEN_SHARE_NOT_SUPPORTED",
          message: "Screen share not supported by browser",
          timestamp: Date.now(),
          context: {
            originalError: error,
            device,
            category: "device" as const,
            recoverable: false,
          },
        });
        return;
      }
    }

    // Fall back to standard error classification
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
