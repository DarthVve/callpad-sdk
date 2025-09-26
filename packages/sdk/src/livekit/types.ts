import type {
  ConnectionQuality,
  DataPacket_Kind,
  Participant,
  Room,
  RoomOptions,
  Track,
  TrackPublication,
} from "livekit-client";

export interface LiveKitConnectionConfig {
  url: string;
  token: string;
  options?: RoomOptions;
}

export interface LiveKitMediaConfig {
  audio: {
    enabled: boolean;
    deviceId?: string;
  };
  video: {
    enabled: boolean;
    deviceId?: string;
  };
  screen?: {
    enabled: boolean;
  };
}

export interface LiveKitParticipant extends Participant {
  displayName?: string;
  avatarUrl?: string;
}

export interface LiveKitTrackInfo {
  track: Track;
  participant: LiveKitParticipant;
  publication: TrackPublication;
  isLocal: boolean;
  kind: Track.Kind;
}

export interface LiveKitEvents {
  participantConnected: { participant: LiveKitParticipant };
  participantDisconnected: { participant: LiveKitParticipant };
  trackSubscribed: { trackInfo: LiveKitTrackInfo };
  trackUnsubscribed: { trackInfo: LiveKitTrackInfo };
  trackMuted: { trackInfo: LiveKitTrackInfo };
  trackUnmuted: { trackInfo: LiveKitTrackInfo };
  connectionQualityChanged: {
    participant: LiveKitParticipant;
    quality: ConnectionQuality;
  };
  dataReceived: {
    data: Uint8Array;
    participant?: LiveKitParticipant;
    kind: DataPacket_Kind;
  };
}

export interface MediaActions {
  enableCamera: () => Promise<void>;
  disableCamera: () => Promise<void>;
  enableMicrophone: () => Promise<void>;
  disableMicrophone: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
}

export interface LiveKitServiceOptions {
  livekitUrl?: string;
  log?: (
    lvl: "debug" | "info" | "warn" | "error",
    msg: string,
    extra?: any
  ) => void;
}
