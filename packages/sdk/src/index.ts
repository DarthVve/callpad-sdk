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
  selectParticipantView,
  selectParticipantsForRinging,
  selectParticipantsInCall,
  selectSpeakingParticipants,
  selectSelf,
  useParticipantView,
  useParticipantsForRinging,
  useParticipantsInCall,
} from "./state/selectors";

// Essential types consumers need
export type {
  SessionStatus,
  Profile,
  Presence,
  MediaSummary,
  ParticipantView,
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

export type {
  CallIncomingEvent,
  CallAcceptedEvent,
  CallJoinInfoEvent,
  CallEndedEvent,
  ParticipantLeftEvent,
} from "./core/socketio/handlers/schema";

// Error management
export * from "./state/errors";

// API configuration
export { apiConfig, type ApiConfig } from "./core/signal/api.config";
