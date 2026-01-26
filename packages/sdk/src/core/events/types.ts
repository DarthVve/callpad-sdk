/**
 * SDK Event System Types
 *
 * This file defines the event types and interfaces for the internal SDK event system.
 * The event system provides extensibility and allows components to communicate
 * through a unified, type-safe event bus.
 */

export interface SdkEvent<T = any> {
  type: string;
  payload: T;
  timestamp: number;
}

/**
 * SDK Event Types
 * Following the pattern from other WebRTC SDKs like LiveKit
 */
export enum SdkEventType {
  // Call lifecycle events
  CALL_INITIATED = "call:initiated",
  CALL_INCOMING = "call:incoming",
  CALL_DECLINED = "call:declined",
  CALL_ENDED = "call:ended",
  CALL_CANCELED = "call:canceled",
  CALL_TIMEOUT = "call:timeout",
  JOIN_INFO_RECEIVED = "join-info:received",
  CALL_STARTED = "call:started",

  // Meeting lifecycle events
  MEETING_CREATED = "meeting:created",
  MEETING_STARTED = "meeting:started",
  MEETING_JOINED = "meeting:joined",
  MEETING_ENDED = "meeting:ended",

  // Participant events
  PARTICIPANT_UPDATED = "participant:updated",
  PARTICIPANT_INVITED = "participant:invited",

  // Recording events
  RECORDING_STARTED = "recording:started",
  RECORDING_STOPPED = "recording:stopped",
}

/**
 * Event handler type
 */
export type EventHandler<T = any> = (event: SdkEvent<T>) => void;

/**
 * Event subscription interface
 */
export interface EventSubscription {
  unsubscribe: () => void;
}
