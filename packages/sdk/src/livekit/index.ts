// Internal LiveKit exports for SDK
export * from "./types";
export * from "./constants";
export { LiveKitService } from "./livekit.service";
export { LiveKitEventBridge } from "./events/eventBridge";
export { trackRegistry } from "./events/trackRegistry";
export type { MediaErrorInfo } from "./error-classifier";
export {
  classifyMediaError,
  MediaDeviceError,
  MediaPermissionError,
  MediaNotFoundError,
  MediaInUseError,
  MediaUnknownError,
} from "./error-classifier";

// Additional exports for subpath consumers
export { DeviceManager } from "./device.manager";
export { MediaControls } from "./media.controls";
export { RoomManager } from "./room.manager";

export * from "./track.utils";

// Re-export essential LiveKit client types that consumers might need
export type {
  Room,
  RoomOptions,
  Participant,
  LocalParticipant,
  RemoteParticipant,
  Track,
  LocalTrack,
  RemoteTrack,
  TrackPublication,
  LocalTrackPublication,
  RemoteTrackPublication,
  ConnectionQuality,
  ConnectionState,
  ParticipantEvent,
  RoomEvent,
  TrackEvent,
  ReconnectPolicy,
  DataPacket_Kind,
} from "livekit-client";

// Livekit hooks
export {
  usePagination,
  useParticipants,
  useRemoteParticipant,
  useRemoteParticipants,
  useConnectionQualityIndicator,
  useEnsureParticipant,
  useEnsureRoom,
  useLocalParticipant,
  useAudioPlayback,
  useConnectionState,
  useDataChannel,
  useDisconnectButton,
  useEnsureTrackRef,
  useIsMuted,
  useIsSpeaking,
  useIsRecording,
  useLiveKitRoom,
  useLocalParticipantPermissions,
  useMediaDevices,
  useParticipantInfo,
  useParticipantTracks,
  usePersistentUserChoices,
  usePinnedTracks,
  usePreviewTracks,
  useRoomContext,
  useRoomInfo,
  useSortedParticipants,
  useSpeakingParticipants,
  useStartAudio,
  useStartVideo,
  useSwipe,
  useTextStream,
  useTracks,
  useTrackByName,
  useTrackMutedIndicator,
  useTrackToggle,
  useTrackVolume,
} from "@livekit/components-react";

export {
  AudioTrack,
  LiveKitRoom,
  ParticipantContext,
  RoomAudioRenderer,
  RoomContext,
  StartAudio,
  StartMediaButton,
  VideoTrack,
} from "@livekit/components-react";
