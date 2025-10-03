import type { Logger } from "../utils/logger";
import { rtcStore } from "./store";
import type { RtcError } from "./types";

// Re-export RtcError type for external consumption
export type { RtcError } from "./types";

export type ErrorCode =
  | "NETWORK" // connectivity, timeouts, CORS
  | "SOCKET_PAYLOAD" // invalid socket data / schema mismatch
  | "JOIN_FLOW" // join-info guard failures (wrong recipient/call)
  | "LIVEKIT_CONNECT" // LK connect/identity mismatch
  | "LIVEKIT_MEDIA" // mic/cam/screen publish/mute errors
  | "MEDIA_PERMISSION" // browser device permissions
  | "DEVICE_SWITCH" // setInput/setOutput failures
  | "API_ERROR" // REST/OpenAPI request/response failures
  | "UNEXPECTED" // anything else
  // Legacy codes (kept for backward compatibility)
  | "IDENTITY_GUARD" // @deprecated - use JOIN_FLOW
  | "VALIDATION_ERROR" // @deprecated - use SOCKET_PAYLOAD
  | "STALE_EVENT"; // @deprecated - use JOIN_FLOW

export function pushError(
  code: ErrorCode,
  message: string,
  context?: any,
  logger?: Logger
): void {
  const error: RtcError = {
    code,
    message,
    timestamp: Date.now(),
    context,
  };

  // Log the error if logger is provided
  logger?.("error", message, { code, context });
  rtcStore.getState().addError(error);
}

/**
 * Clear errors from the store
 * @param predicate Optional filter function - if provided, only matching errors are removed
 */
export function clearErrors(predicate?: (error: RtcError) => boolean): void {
  rtcStore.getState().patch((state) => {
    if (predicate) {
      // Remove only errors matching the predicate
      state.errors = state.errors.filter((error) => !predicate(error));
    } else {
      // Clear all errors
      state.errors = [];
    }
  });
}

// Convenience helpers for common error scenarios
export function pushSocketValidationError(
  eventType: string,
  issues: any,
  payload?: any,
  logger?: Logger
): void {
  pushError(
    "SOCKET_PAYLOAD",
    `Invalid ${eventType} event payload`,
    { eventType, issues, payload },
    logger
  );
}

export function pushIdentityGuardError(
  reason: string,
  expected?: string,
  received?: string,
  logger?: Logger
): void {
  pushError(
    "JOIN_FLOW", // Use new error code
    `Identity guard failed: ${reason}`,
    { expected, received },
    logger
  );
}

export function pushLiveKitConnectError(
  message: string,
  error: unknown,
  logger?: Logger
): void {
  pushError(
    "LIVEKIT_CONNECT",
    `LiveKit connection failed: ${message}`,
    { originalError: error },
    logger
  );
}

export function pushStaleEventError(
  eventType: string,
  reason: string,
  context?: any,
  logger?: Logger
): void {
  pushError(
    "JOIN_FLOW", // Use new error code
    `Ignored stale ${eventType} event: ${reason}`,
    context,
    logger
  );
}

export function pushApiError(
  operation: string,
  error: unknown,
  logger?: Logger
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  pushError(
    "API_ERROR",
    `API ${operation} failed: ${errorMessage}`,
    { operation, originalError: error },
    logger
  );
}

export function pushNetworkError(
  operation: string,
  error: unknown,
  logger?: Logger
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  pushError(
    "NETWORK",
    `Network error during ${operation}: ${errorMessage}`,
    { operation, originalError: error },
    logger
  );
}

export function pushMediaPermissionError(
  device: string,
  error?: unknown,
  logger?: Logger
): void {
  pushError(
    "MEDIA_PERMISSION",
    `${device} permission denied`,
    { device, originalError: error },
    logger
  );
}

export function pushDeviceError(
  operation: string,
  device: string,
  error: unknown,
  logger?: Logger
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  pushError(
    "DEVICE_SWITCH",
    `Failed to ${operation} ${device}: ${errorMessage}`,
    { operation, device, originalError: error },
    logger
  );
}
