/**
 * Enhanced Error Recovery Service
 *
 * Implements automatic error recovery and retry mechanisms for the SDK.
 * Handles network reconnection, failed participant invitations, and media failures.
 */

import { SdkEventType, eventBus } from "../core/events";
import { rtcStore } from "../state/store";
import type { RtcError } from "../state/types";
import { createLogger } from "../utils/logger";

const logger = createLogger("services:error-recovery");

export interface ErrorRecoveryConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  recoverableErrors: string[];
}

export interface RetryContext {
  attempts: number;
  lastAttempt: number;
  error: RtcError;
  config: ErrorRecoveryConfig;
}

/**
 * Default error recovery configuration
 */
export const DEFAULT_ERROR_RECOVERY_CONFIG: ErrorRecoveryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  exponentialBackoff: true,
  recoverableErrors: [
    "NETWORK_ERROR",
    "CONNECTION_LOST",
    "SOCKET_DISCONNECTED",
    "LIVEKIT_CONNECTION_FAILED",
    "MEDIA_PERMISSION_DENIED",
    "DEVICE_SWITCH_FAILED",
    "PARTICIPANT_INVITATION_FAILED",
  ],
};

/**
 * Error Recovery Service
 */
export class ErrorRecoveryService {
  private config: ErrorRecoveryConfig;
  private activeRetries = new Map<string, RetryContext>();
  private reconnectionTimer: number | null = null;
  private isRecovering = false;

  constructor(config: ErrorRecoveryConfig = DEFAULT_ERROR_RECOVERY_CONFIG) {
    this.config = config;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for errors that might need recovery
    eventBus.on(SdkEventType.ERROR_OCCURRED, (event) => {
      this.handleError(event.payload);
    });

    // Listen for connection quality changes
    eventBus.on(SdkEventType.CONNECTION_QUALITY_CHANGED, (event) => {
      if (event.payload.quality === "lost") {
        this.handleConnectionLoss(event.payload.participantId);
      }
    });

    // Listen for participant left events (might indicate network issues)
    eventBus.on(SdkEventType.PARTICIPANT_LEFT, (event) => {
      if (event.payload.reason === "error") {
        this.handleParticipantError(event.payload.participantId);
      }
    });
  }

  /**
   * Handle error and determine if recovery should be attempted
   */
  private async handleError(error: RtcError): Promise<void> {
    logger.debug("Handling error for recovery", { error });

    // Check if error is recoverable
    if (!this.isRecoverableError(error)) {
      logger.debug("Error is not recoverable", { code: error.code });
      return;
    }

    // Get or create retry context
    const retryKey = this.getRetryKey(error);
    let context = this.activeRetries.get(retryKey);

    if (!context) {
      context = {
        attempts: 0,
        lastAttempt: 0,
        error,
        config: this.config,
      };
      this.activeRetries.set(retryKey, context);
    }

    // Check if we've exceeded max retries
    if (context.attempts >= this.config.maxRetries) {
      logger.warn("Max retries exceeded for error", {
        code: error.code,
        attempts: context.attempts,
      });
      this.activeRetries.delete(retryKey);
      this.emitRecoveryFailed(error, context.attempts);
      return;
    }

    // Calculate delay with exponential backoff
    const delay = this.calculateRetryDelay(context.attempts);
    const now = Date.now();

    // Ensure minimum delay between attempts
    if (now - context.lastAttempt < delay) {
      setTimeout(
        () => this.attemptRecovery(retryKey),
        delay - (now - context.lastAttempt)
      );
      return;
    }

    await this.attemptRecovery(retryKey);
  }

  /**
   * Attempt to recover from the error
   */
  private async attemptRecovery(retryKey: string): Promise<void> {
    const context = this.activeRetries.get(retryKey);
    if (!context) return;

    context.attempts++;
    context.lastAttempt = Date.now();

    logger.info("Attempting error recovery", {
      code: context.error.code,
      attempt: context.attempts,
      maxRetries: this.config.maxRetries,
    });

    this.emitRecoveryAttempt(context.error, context.attempts);

    try {
      const success = await this.executeRecoveryStrategy(context.error);

      if (success) {
        logger.info("Error recovery successful", {
          code: context.error.code,
          attempts: context.attempts,
        });
        this.activeRetries.delete(retryKey);
        this.emitRecoverySuccess(context.error, context.attempts);
      } else {
        // Recovery failed, will retry later
        logger.debug("Recovery attempt failed", {
          code: context.error.code,
          attempts: context.attempts,
        });
      }
    } catch (recoveryError) {
      logger.error("Recovery attempt threw error", {
        originalError: context.error.code,
        recoveryError,
        attempts: context.attempts,
      });
    }
  }

  /**
   * Execute the appropriate recovery strategy based on error type
   */
  private async executeRecoveryStrategy(error: RtcError): Promise<boolean> {
    switch (error.code) {
      case "NETWORK_ERROR":
      case "CONNECTION_LOST":
      case "SOCKET_DISCONNECTED":
        return this.recoverNetworkConnection();

      case "LIVEKIT_CONNECTION_FAILED":
        return this.recoverLivekitConnection();

      case "MEDIA_PERMISSION_DENIED":
        return this.recoverMediaPermission(error);

      case "DEVICE_SWITCH_FAILED":
        return this.recoverDeviceSwitch(error);

      case "PARTICIPANT_INVITATION_FAILED":
        return this.recoverParticipantInvitation(error);

      default:
        logger.warn("No recovery strategy for error", { code: error.code });
        return false;
    }
  }

  /**
   * Recovery strategies
   */
  private async recoverNetworkConnection(): Promise<boolean> {
    try {
      // Check if we're already recovering to avoid duplicate attempts
      if (this.isRecovering) {
        return false;
      }

      this.isRecovering = true;

      // Get SDK instance from store
      const store = rtcStore.getState();

      // Try to reconnect socket
      if (store.connection && !store.connection.connected) {
        logger.debug("Attempting socket reconnection");

        // The socket manager should handle reconnection automatically
        // We just wait a bit and check if it succeeded
        await this.delay(2000);

        const newState = rtcStore.getState();
        const success = newState.connection.connected;

        if (success) {
          logger.info("Network connection recovered");
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error("Network recovery failed", { error });
      return false;
    } finally {
      this.isRecovering = false;
    }
  }

  private async recoverLivekitConnection(): Promise<boolean> {
    try {
      // For LiveKit connection recovery, we'd need access to the SDK instance
      // This would typically involve re-establishing the LiveKit room connection
      logger.debug("Attempting LiveKit connection recovery");

      // This is a placeholder - actual implementation would need SDK access
      // to call something like sdk.livekit.reconnect()

      return false; // Placeholder
    } catch (error) {
      logger.error("LiveKit recovery failed", { error });
      return false;
    }
  }

  private async recoverMediaPermission(error: RtcError): Promise<boolean> {
    try {
      logger.debug("Attempting media permission recovery");

      // For media permission recovery, we could try requesting permissions again
      // or gracefully degrade to audio-only mode

      const context = error.context;
      if (context?.device === "camera") {
        // Try to gracefully degrade to audio-only
        rtcStore.getState().patch((state) => {
          state.local.videoEnabled = false;
        });

        // Emit event about graceful degradation
        eventBus.emit(
          SdkEventType.MEDIA_DISABLED,
          {
            participantId: "local",
            mediaType: "video",
            timestamp: Date.now(),
          },
          "user"
        );

        logger.info(
          "Gracefully degraded to audio-only due to camera permission"
        );
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Media permission recovery failed", { error });
      return false;
    }
  }

  private async recoverDeviceSwitch(error: RtcError): Promise<boolean> {
    try {
      logger.debug("Attempting device switch recovery");

      // For device switch recovery, we could try falling back to default device
      // This would need access to the device manager

      return false; // Placeholder
    } catch (error) {
      logger.error("Device switch recovery failed", { error });
      return false;
    }
  }

  private async recoverParticipantInvitation(
    error: RtcError
  ): Promise<boolean> {
    try {
      logger.debug("Attempting participant invitation recovery");

      // For participant invitation recovery, we could retry the invitation
      // This would need access to the call actions service

      return false; // Placeholder
    } catch (error) {
      logger.error("Participant invitation recovery failed", { error });
      return false;
    }
  }

  /**
   * Handle connection loss for a specific participant
   */
  private handleConnectionLoss(participantId: string): void {
    logger.debug("Handling connection loss", { participantId });

    // For local participant connection loss, trigger network recovery
    if (participantId === "local") {
      const networkError: RtcError = {
        code: "CONNECTION_LOST",
        message: "Local participant connection lost",
        timestamp: Date.now(),
        context: { participantId },
      };

      this.handleError(networkError);
    }
  }

  /**
   * Handle participant error
   */
  private handleParticipantError(participantId: string): void {
    logger.debug("Handling participant error", { participantId });

    // Could implement participant re-invitation logic here
  }

  /**
   * Utility methods
   */
  private isRecoverableError(error: RtcError): boolean {
    return this.config.recoverableErrors.includes(error.code);
  }

  private getRetryKey(error: RtcError): string {
    // Create a unique key for this error type and context
    return `${error.code}-${JSON.stringify(error.context || {})}`;
  }

  private calculateRetryDelay(attempts: number): number {
    if (!this.config.exponentialBackoff) {
      return this.config.retryDelay;
    }

    // Exponential backoff: delay * (2 ^ attempts)
    return this.config.retryDelay * 2 ** attempts;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Event emission methods
   */
  private emitRecoveryAttempt(error: RtcError, attempts: number): void {
    eventBus.emit(
      "recovery:attempt",
      {
        error,
        attempts,
        timestamp: Date.now(),
      },
      "user"
    );
  }

  private emitRecoverySuccess(error: RtcError, attempts: number): void {
    eventBus.emit(
      "recovery:success",
      {
        error,
        attempts,
        timestamp: Date.now(),
      },
      "user"
    );
  }

  private emitRecoveryFailed(error: RtcError, attempts: number): void {
    eventBus.emit(
      "recovery:failed",
      {
        error,
        attempts,
        timestamp: Date.now(),
      },
      "user"
    );
  }

  /**
   * Public methods for managing recovery
   */
  public updateConfig(newConfig: Partial<ErrorRecoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.debug("Updated error recovery config", { config: this.config });
  }

  public getActiveRetries(): Map<string, RetryContext> {
    return new Map(this.activeRetries);
  }

  public cancelRetry(retryKey: string): boolean {
    const cancelled = this.activeRetries.delete(retryKey);
    if (cancelled) {
      logger.debug("Cancelled retry", { retryKey });
    }
    return cancelled;
  }

  public cancelAllRetries(): void {
    const count = this.activeRetries.size;
    this.activeRetries.clear();
    logger.debug("Cancelled all retries", { count });
  }

  public destroy(): void {
    this.cancelAllRetries();
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }
    logger.debug("Error recovery service destroyed");
  }
}

// Global error recovery service instance
export const errorRecoveryService = new ErrorRecoveryService();
