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
  source: "socket" | "livekit" | "user";
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

  // Participant events
  PARTICIPANT_UPDATED = "participant:updated",
  PARTICIPANT_INVITED = "participant:invited",

  // Media events
  MEDIA_ENABLED = "media:enabled",
  MEDIA_DISABLED = "media:disabled",
  MEDIA_DEVICE_CHANGED = "media:device-changed",
  MEDIA_PERMISSION_GRANTED = "media:permission-granted",
  MEDIA_PERMISSION_DENIED = "media:permission-denied",

  // Connection events
  CONNECTION_ESTABLISHED = "connection:established",
  CONNECTION_LOST = "connection:lost",
  CONNECTION_RECONNECTING = "connection:reconnecting",
  CONNECTION_QUALITY_CHANGED = "connection:quality-changed",

  // Error events
  ERROR_OCCURRED = "error:occurred",
}

/**
 * Specific event payload types
 */
export interface CallInitiatedEvent {
  callId: string;
  participants: string[];
  type: "AUDIO" | "VIDEO";
  timestamp: number;
}

export interface CallIncomingEvent {
  callId: string;
  caller: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  type: "AUDIO" | "VIDEO";
  timestamp: number;
  // Additional participants info for context (but not stored in state)
  participants?: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    role?: "CALLER" | "CALLEE" | "HOST" | "MEMBER";
  }>;
}


export interface CallDeclinedEvent {
  callId: string;
  participantId?: string;
  reason?: string;
  timestamp: number;
}

export interface CallEndedEvent {
  callId: string;
  endedBy?: string;
  reason?: "user" | "timeout" | "error";
  timestamp: number;
}

export interface JoinInfoReceivedEvent {
  callId: string;
  participantId: string;
  timestamp: number;
  hasUrl: boolean;
  hasToken: boolean;
  autoJoined?: boolean;
}


export interface MediaEnabledEvent {
  participantId: string;
  mediaType: "audio" | "video" | "screen";
  timestamp: number;
}

export interface MediaDisabledEvent {
  participantId: string;
  mediaType: "audio" | "video" | "screen";
  timestamp: number;
}

export interface ConnectionQualityChangedEvent {
  participantId: string;
  quality: "excellent" | "good" | "poor" | "lost";
  timestamp: number;
}

export interface ErrorOccurredEvent {
  code: string;
  message: string;
  details?: any;
  source: "socket" | "livekit" | "user";
  timestamp: number;
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

/**
 * Event filter function type
 */
export type EventFilter<T = any> = (event: SdkEvent<T>) => boolean;

export interface ParticipantInvitedEvent {
  callId: string;
  participant: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  timestamp: number;
}

