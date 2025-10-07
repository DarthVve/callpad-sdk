import { useEffect, useState, useMemo, useRef } from "react";
import { eventBus } from "../core/events";
import {
  type ErrorRecoveryConfig,
  type RetryContext,
  errorRecoveryService,
} from "../services/error-recovery";
import type { RtcError } from "../state/types";

/**
 * Error recovery status interface
 */
export interface ErrorRecoveryStatus {
  isRecovering: boolean;
  activeRetries: Map<string, RetryContext>;
  lastRecoveryAttempt?: {
    error: RtcError;
    attempts: number;
    timestamp: number;
  };
  lastRecoveryResult?: {
    error: RtcError;
    attempts: number;
    success: boolean;
    timestamp: number;
  };
}

/**
 * Hook for monitoring and controlling error recovery
 *
 * Provides real-time status of error recovery attempts and allows
 * configuration of recovery behavior.
 *
 * @param config - Optional recovery configuration override
 * @returns Error recovery status and control methods
 *
 * @example
 * const {
 *   status,
 *   updateConfig,
 *   cancelRetry,
 *   cancelAllRetries
 * } = useErrorRecovery();
 *
 * // Monitor recovery status
 * if (status.isRecovering) {
 *   // Handle recovery state
 * }
 *
 * // Configure recovery behavior
 * updateConfig({ maxRetries: 5, retryDelay: 2000 });
 */
export function useErrorRecovery(config?: Partial<ErrorRecoveryConfig>) {
  const [status, setStatus] = useState<ErrorRecoveryStatus>({
    isRecovering: false,
    activeRetries: new Map(),
  });

  // Memoize config to prevent infinite re-renders
  const memoizedConfig = useMemo(() => config, [JSON.stringify(config)]);
  const configAppliedRef = useRef(false);

  useEffect(() => {
    // Apply config if provided and not already applied
    if (memoizedConfig && !configAppliedRef.current) {
      errorRecoveryService.updateConfig(memoizedConfig);
      configAppliedRef.current = true;
    }

    // Listen for recovery events
    const recoveryAttemptSub = eventBus.on("recovery:attempt", (event) => {
      setStatus((prev) => ({
        ...prev,
        isRecovering: true,
        lastRecoveryAttempt: event.payload,
        activeRetries: errorRecoveryService.getActiveRetries(),
      }));
    });

    const recoverySuccessSub = eventBus.on("recovery:success", (event) => {
      setStatus((prev) => ({
        ...prev,
        isRecovering: false,
        lastRecoveryResult: {
          ...event.payload,
          success: true,
        },
        activeRetries: errorRecoveryService.getActiveRetries(),
      }));
    });

    const recoveryFailedSub = eventBus.on("recovery:failed", (event) => {
      setStatus((prev) => ({
        ...prev,
        isRecovering: false,
        lastRecoveryResult: {
          ...event.payload,
          success: false,
        },
        activeRetries: errorRecoveryService.getActiveRetries(),
      }));
    });

    // Update active retries periodically
    const updateInterval = setInterval(() => {
      setStatus((prev) => ({
        ...prev,
        activeRetries: errorRecoveryService.getActiveRetries(),
        isRecovering: errorRecoveryService.getActiveRetries().size > 0,
      }));
    }, 1000);

    return () => {
      recoveryAttemptSub.unsubscribe();
      recoverySuccessSub.unsubscribe();
      recoveryFailedSub.unsubscribe();
      clearInterval(updateInterval);
    };
  }, [memoizedConfig]);

  const updateConfig = (newConfig: Partial<ErrorRecoveryConfig>) => {
    errorRecoveryService.updateConfig(newConfig);
  };

  const cancelRetry = (retryKey: string) => {
    const cancelled = errorRecoveryService.cancelRetry(retryKey);
    if (cancelled) {
      setStatus((prev) => ({
        ...prev,
        activeRetries: errorRecoveryService.getActiveRetries(),
        isRecovering: errorRecoveryService.getActiveRetries().size > 0,
      }));
    }
    return cancelled;
  };

  const cancelAllRetries = () => {
    errorRecoveryService.cancelAllRetries();
    setStatus((prev) => ({
      ...prev,
      activeRetries: new Map(),
      isRecovering: false,
    }));
  };

  return {
    status,
    updateConfig,
    cancelRetry,
    cancelAllRetries,
  };
}

/**
 * Hook for monitoring recovery of a specific error type
 *
 * @param errorCode - The error code to monitor
 * @returns Recovery status for the specific error type
 */
export function useErrorRecoveryForType(errorCode: string) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<number>(0);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    const recoveryAttemptSub = eventBus.on("recovery:attempt", (event) => {
      if (event.payload.error.code === errorCode) {
        setIsRecovering(true);
        setLastAttempt(event.payload.attempts);
      }
    });

    const recoverySuccessSub = eventBus.on("recovery:success", (event) => {
      if (event.payload.error.code === errorCode) {
        setIsRecovering(false);
        setLastResult({ success: true, timestamp: event.payload.timestamp });
      }
    });

    const recoveryFailedSub = eventBus.on("recovery:failed", (event) => {
      if (event.payload.error.code === errorCode) {
        setIsRecovering(false);
        setLastResult({ success: false, timestamp: event.payload.timestamp });
      }
    });

    return () => {
      recoveryAttemptSub.unsubscribe();
      recoverySuccessSub.unsubscribe();
      recoveryFailedSub.unsubscribe();
    };
  }, [errorCode]);

  return {
    isRecovering,
    lastAttempt,
    lastResult,
  };
}

/**
 * Hook for automatic graceful degradation
 *
 * Automatically handles graceful degradation scenarios like
 * falling back to audio-only when video fails.
 *
 * @param degradationConfig - Configuration for degradation behavior
 */
export function useGracefulDegradation(degradationConfig?: {
  enableAudioOnlyFallback?: boolean;
  enableLowerQualityFallback?: boolean;
  notifyUser?: boolean;
}) {
  // Memoize config to prevent infinite re-renders
  const config = useMemo(() => ({
    enableAudioOnlyFallback: true,
    enableLowerQualityFallback: true,
    notifyUser: true,
    ...degradationConfig,
  }), [degradationConfig?.enableAudioOnlyFallback, degradationConfig?.enableLowerQualityFallback, degradationConfig?.notifyUser]);

  const [degradationStatus, setDegradationStatus] = useState({
    isAudioOnly: false,
    isLowerQuality: false,
    reason: null as string | null,
  });

  useEffect(() => {
    // Listen for media failures that might trigger degradation
    const mediaDisabledSub = eventBus.on("media:disabled", (event) => {
      if (
        event.payload.mediaType === "video" &&
        config.enableAudioOnlyFallback
      ) {
        setDegradationStatus((prev) => ({
          ...prev,
          isAudioOnly: true,
          reason: "video_disabled",
        }));

        if (config.notifyUser) {
          // Could emit a user notification event here
          eventBus.emit(
            "degradation:audio-only",
            {
              reason: "video_disabled",
              timestamp: Date.now(),
            },
            "user"
          );
        }
      }
    });

    // Listen for connection quality changes that might trigger degradation
    const qualityChangedSub = eventBus.on(
      "connection:quality-changed",
      (event) => {
        if (
          event.payload.quality === "poor" &&
          config.enableLowerQualityFallback
        ) {
          setDegradationStatus((prev) => ({
            ...prev,
            isLowerQuality: true,
            reason: "poor_connection",
          }));

          if (config.notifyUser) {
            eventBus.emit(
              "degradation:lower-quality",
              {
                reason: "poor_connection",
                timestamp: Date.now(),
              },
              "user"
            );
          }
        }
      }
    );

    return () => {
      mediaDisabledSub.unsubscribe();
      qualityChangedSub.unsubscribe();
    };
  }, [config]);

  const resetDegradation = () => {
    setDegradationStatus({
      isAudioOnly: false,
      isLowerQuality: false,
      reason: null,
    });
  };

  return {
    degradationStatus,
    resetDegradation,
  };
}
