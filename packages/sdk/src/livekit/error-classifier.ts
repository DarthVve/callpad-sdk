import { MediaDeviceFailure } from "livekit-client";

export interface MediaErrorInfo {
  code: string;
  userMessage: string;
  recoverable: boolean;
  category: "permission" | "device" | "unknown";
}

export abstract class MediaDeviceError extends Error {
  abstract readonly code: string;
  abstract readonly recoverable: boolean;
  abstract readonly category: "permission" | "device" | "unknown";
  readonly device: string;
  readonly deviceName: string;
  readonly cause: Error | undefined;

  protected constructor(message: string, device: string, cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.device = device;
    this.deviceName = device === "camera" ? "camera" : "microphone";
    this.cause = cause;
  }
}

export class MediaPermissionError extends MediaDeviceError {
  readonly code: string;
  readonly recoverable = true;
  readonly category = "permission" as const;

  constructor(message: string, device: string, cause?: Error) {
    super(message, device, cause);
    this.code =
      device === "camera"
        ? "CAMERA_PERMISSION_DENIED"
        : "MICROPHONE_PERMISSION_DENIED";
  }
}

export class MediaNotFoundError extends MediaDeviceError {
  readonly code: string;
  readonly recoverable = false;
  readonly category = "device" as const;

  constructor(message: string, device: string, cause?: Error) {
    super(message, device, cause);
    this.code =
      device === "camera" ? "CAMERA_NOT_FOUND" : "MICROPHONE_NOT_FOUND";
  }
}

export class MediaInUseError extends MediaDeviceError {
  readonly code: string;
  readonly recoverable = true;
  readonly category = "device" as const;

  constructor(message: string, device: string, cause?: Error) {
    super(message, device, cause);
    this.code = device === "camera" ? "CAMERA_IN_USE" : "MICROPHONE_IN_USE";
  }
}

export class MediaUnknownError extends MediaDeviceError {
  readonly code: string;
  readonly recoverable = false;
  readonly category = "unknown" as const;

  constructor(message: string, device: string, cause?: Error) {
    super(message, device, cause);
    this.code =
      device === "camera" ? "CAMERA_UNKNOWN_ERROR" : "MICROPHONE_UNKNOWN_ERROR";
  }
}

export function classifyMediaError(
  error: unknown,
  device: string,
  livekitError?: Error
): MediaDeviceError {
  // Try LiveKit classification first
  const livekitFailure = MediaDeviceFailure.getFailure(error as Error);
  if (livekitFailure) {
    return createErrorFromFailure(livekitFailure, device, error as Error);
  }

  // Use LiveKit lastError if available
  if (livekitError) {
    const livekitFailureFromLastError =
      MediaDeviceFailure.getFailure(livekitError);
    if (livekitFailureFromLastError) {
      return createErrorFromFailure(
        livekitFailureFromLastError,
        device,
        livekitError
      );
    }
  }

  // Fall back to basic error analysis for unhandled cases
  const cause = error instanceof Error ? error : undefined;
  const message = cause?.message?.toLowerCase() || "";

  if (
    message.includes("permission") ||
    message.includes("denied") ||
    message.includes("notallowed")
  ) {
    return new MediaPermissionError("Permission denied", device, cause);
  }

  if (
    message.includes("not found") ||
    message.includes("unavailable") ||
    message.includes("notfound")
  ) {
    return new MediaNotFoundError("Device not found", device, cause);
  }

  if (
    message.includes("already in use") ||
    message.includes("busy") ||
    message.includes("in use")
  ) {
    return new MediaInUseError("Device in use", device, cause);
  }

  // Final fallback
  return new MediaUnknownError(
    cause ? `Unknown error: ${cause.message}` : "Unknown device error",
    device,
    cause
  );
}

function createErrorFromFailure(
  failure: MediaDeviceFailure,
  device: string,
  cause: Error
): MediaDeviceError {
  switch (failure) {
    case MediaDeviceFailure.PermissionDenied:
      return new MediaPermissionError("Permission denied", device, cause);
    case MediaDeviceFailure.NotFound:
      return new MediaNotFoundError("Device not found", device, cause);
    case MediaDeviceFailure.DeviceInUse:
      return new MediaInUseError("Device in use", device, cause);
    default:
      return new MediaUnknownError(
        `LiveKit failure: ${failure}`,
        device,
        cause
      );
  }
}
