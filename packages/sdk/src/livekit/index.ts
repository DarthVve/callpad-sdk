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

// Track utilities
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
  AudioTrack,
  VideoTrack,
  TrackPublication,
  LocalTrackPublication,
  RemoteTrackPublication,
  ConnectionQuality,
  ConnectionState,
  ParticipantEvent,
  RoomEvent,
  TrackEvent,
  // Additional utility types
  ReconnectPolicy,
  // Newer types that might be useful
  DataPacket_Kind,
} from "livekit-client";
