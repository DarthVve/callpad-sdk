// React integration - main SDK entry points
export {
  RtcProvider,
  useSdk,
  type RtcOptions,
  type RtcSdk,
} from "./provider/RtcProvider";

// React hooks for call management
export * from "./hooks";

// State selectors for advanced usage
export {
  useParticipant,
  useRingingParticipants,
  useLocalParticipant,
  useSpeakingParticipants,
} from "./state/selectors";

// Essential types consumers need
export type {
  SessionStatus,
  Participant,
  PermissionStatus,
  DeviceState,
  IncomingCallInfo,
  LiveKitJoinInfo,
  RtcError,
  RtcState,
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
export type {
  SdkEvent,
  SdkEventType,
  EventHandler,
  EventSubscription,
  EventFilter,
  CallInitiatedEvent,
  CallIncomingEvent,
  CallAcceptedEvent,
  CallDeclinedEvent,
  CallEndedEvent,
  ParticipantJoinedEvent,
  ParticipantLeftEvent,
  MediaEnabledEvent,
  MediaDisabledEvent,
  ConnectionQualityChangedEvent,
  ErrorOccurredEvent,
} from "./core/events/types";
