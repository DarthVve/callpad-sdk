// React integration - main SDK entry points
export {
  RtcProvider,
  useSdk,
  type RtcOptions,
  type RtcSdk,
} from "./provider/RtcProvider";

// React hooks for call management
export * from "./hooks";

// React components
export * from "./components";


// Essential types consumers need
export type {
  SessionStatus,
  Participant,
  PermissionStatus,
  DeviceState,
  LiveKitJoinInfo,
  RtcError,
  RtcState,
  TrackReference,
} from "./state/types";

// Signal client types for call initiation
export type {
  InitiateCallParams,
  CallResponse,
  CallActionResponse,
} from "./core/signal/types";

export type { CallJoinInfoEvent } from "./core/socketio/handlers/schema";

// Error management
export * from "./state/errors";

// API configuration
export { apiConfig, type ApiConfig } from "./core/signal/api.config";

// Event system for advanced usage
export { eventBus } from "./core/events";
export {
  SdkEventType,
} from "./core/events/types";
export type {
  SdkEvent,
  EventHandler,
  EventSubscription,
  EventFilter,
  CallInitiatedEvent,
  CallIncomingEvent,
  CallDeclinedEvent,
  CallEndedEvent,
  MediaEnabledEvent,
  MediaDisabledEvent,
  ConnectionQualityChangedEvent,
  ErrorOccurredEvent,
  ParticipantInvitedEvent,
} from "./core/events/types";
