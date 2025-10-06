import {
  type LocalTrack,
  type RemoteTrack,
  Track,
  type TrackPublication,
} from "livekit-client";
import { createLogger } from "../utils/logger";
import { TRACK_ATTACHMENT_CONFIG } from "./constants";

/**
 * Utility functions for working with LiveKit tracks
 */

const logger = createLogger("livekit:tracks");

export interface TrackAttachmentOptions {
  /**
   * Maximum number of retry attempts for track attachment
   */
  maxRetries?: number;
  /**
   * Delay between retry attempts in milliseconds
   */
  retryDelay?: number;
  /**
   * Whether to use exponential backoff for retries
   */
  exponentialBackoff?: boolean;
  /**
   * Custom audio/video element attributes
   */
  elementAttributes?: Record<string, string | boolean>;
}

/**
 * Attaches a track to an HTML media element with retry logic
 */
export async function attachTrackToElement(
  track: Track,
  element: HTMLMediaElement,
  options: TrackAttachmentOptions = {}
): Promise<void> {
  const config = {
    ...TRACK_ATTACHMENT_CONFIG,
    ...options,
  };

  let attempt = 0;
  let lastError: Error | undefined;

  while (attempt <= config.maxRetries) {
    try {
      // Apply custom attributes if provided
      if (config.elementAttributes) {
        for (const [key, value] of Object.entries(config.elementAttributes)) {
          if (typeof value === "boolean") {
            if (value) {
              element.setAttribute(key, "");
            } else {
              element.removeAttribute(key);
            }
          } else {
            element.setAttribute(key, value);
          }
        }
      }

      await track.attach(element);
      return; // Success!
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt >= config.maxRetries) {
        break;
      }

      // Calculate delay with optional exponential backoff
      const delay = config.exponentialBackoff
        ? config.retryDelay * 2 ** attempt
        : config.retryDelay;

      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
    }
  }

  throw new Error(
    `Failed to attach track after ${config.maxRetries + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Detaches a track from an HTML media element safely
 */
export function detachTrackFromElement(
  track: Track,
  element?: HTMLMediaElement
): void {
  try {
    if (element) {
      track.detach(element);
    } else {
      track.detach();
    }
  } catch (error) {
    logger.warn("Failed to detach track", { error });
  }
}

/**
 * Attaches multiple tracks to their respective elements
 */
export async function attachTracks(
  trackElements: Array<{
    track: Track;
    element: HTMLMediaElement;
    options?: TrackAttachmentOptions;
  }>
): Promise<void> {
  const attachmentPromises = trackElements.map(({ track, element, options }) =>
    attachTrackToElement(track, element, options)
  );

  await Promise.all(attachmentPromises);
}

/**
 * Detaches multiple tracks from their elements
 */
export function detachTracks(
  trackElements: Array<{ track: Track; element?: HTMLMediaElement }>
): void {
  for (const { track, element } of trackElements) {
    detachTrackFromElement(track, element);
  }
}

/**
 * Helper to get track from publication safely
 */
export function getTrackFromPublication(
  publication: TrackPublication
): Track | undefined {
  return publication.track || undefined;
}

/**
 * Helper to check if a track is ready for attachment
 */
export function isTrackReady(track: Track): boolean {
  return track.mediaStream?.active ?? false;
}

/**
 * Creates an audio or video element for track attachment
 */
export function createMediaElement(
  track: Track,
  attributes: Record<string, string | boolean> = {}
): HTMLMediaElement {
  const element =
    track.kind === Track.Kind.Video
      ? document.createElement("video")
      : document.createElement("audio");

  // Apply default attributes
  const defaultAttributes = {
    autoplay: true,
    playsInline: true,
    controls: false,
    muted: track.kind === Track.Kind.Video, // Auto-mute video to allow autoplay
  };

  const allAttributes = { ...defaultAttributes, ...attributes };

  for (const [key, value] of Object.entries(allAttributes)) {
    if (typeof value === "boolean") {
      if (value) {
        element.setAttribute(key, "");
      }
    } else {
      element.setAttribute(key, value);
    }
  }

  return element;
}

/**
 * Utility to handle track visibility (for video tracks)
 */
export function setTrackVisibility(
  element: HTMLVideoElement,
  visible: boolean
): void {
  if (visible) {
    element.style.display = "";
    element.style.visibility = "";
  } else {
    element.style.display = "none";
  }
}

/**
 * Enhanced error information for track operations
 */
export interface TrackError extends Error {
  code: string;
  track?: Track | undefined;
  element?: HTMLMediaElement | undefined;
  retryable: boolean;
}

/**
 * Creates a standardized track error
 */
export function createTrackError(
  message: string,
  code: string,
  track?: Track | undefined,
  element?: HTMLMediaElement | undefined,
  retryable = true
): TrackError {
  const error = new Error(message) as TrackError;
  error.code = code;
  error.track = track;
  error.element = element;
  error.retryable = retryable;
  return error;
}
