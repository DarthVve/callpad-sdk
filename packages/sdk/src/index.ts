export {
  RtcProvider,
  useSdk,
  useGuestSdk,
  type RtcOptions,
  type RtcSdk,
  type GuestRtcSdk,
} from "./provider/RtcProvider";
export * from "./hooks";
export type {
  ParticipantMetadata,
  LiveKitJoinInfo,
  Session,
  SessionType,
  MeetingInfo,
  IncomingInvite,
  OutgoingInvite,
  RtcError,
  RtcState,
  Profile,
  RecordingInfo,
  GuestIdentity,
  ParticipantPermissions,
} from "./state/types";
export type {
  Meeting,
  MeetingStatus,
  MeetingJoinInfo,
  CreateAdHocMeetingParams,
  JoinMeetingParams,
  MeetingResponse,
  EndMeetingResponse,
} from "./state/meetings.types";
export { useProfileCache, profileCache } from "./state/profileCache";
export { useRecordingStore, recordingStore } from "./state/recording.store";
export type {
  UserPresence,
  PresenceStatus,
  PresenceConfig,
} from "./state/presence.types";
export type {
  InitiateCallParams,
  CallResponse,
  CallActionResponse,
} from "./clients/signal/types";
export * from "./generated/socket/events";
export * from "./state/errors";
export { apiConfig, type ApiConfig } from "./clients/signal/config";
export { eventBus } from "./core/events";
export { SdkEventType } from "./core/events/types";
export type {
  SdkEvent,
  EventHandler,
  EventSubscription,
} from "./core/events/types";
export * from "./clients/signal";
export {
  buildSdk,
  buildGuestSdk,
  type SdkBuildOptions,
  type SdkBuildOptionsBase,
  type AuthenticatedSdkOptions,
  type GuestSdkOptions,
} from "./services/sdk-builder";
export type { GuestJoinMeetingParams } from "./services/meetings.service";
export type { GuestSessionInfo } from "./core/guest-auth.manager";
