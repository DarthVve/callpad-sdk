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
  enableScreenShare: () => Promise<void>;
  disableScreenShare: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
}

export interface LiveKitServiceOptions {
  log:
    | ((
        lvl: "debug" | "info" | "warn" | "error",
        msg: string,
        extra?: any
      ) => void)
    | undefined;
  appId?: string;
}

/**
 * RPC (Remote Procedure Call) related types and interfaces
 */
export interface RpcMethodHandler<TReq = any, TRes = any> {
  method: string;
  handler: (data: TReq, caller: Participant) => Promise<TRes> | TRes;
}

export interface RpcCallOptions {
  /**
   * Timeout for the RPC call in milliseconds
   */
  timeout?: number;
  /**
   * Whether to wait for a response
   */
  waitForResponse?: boolean;
}

export interface RpcManager {
  /**
   * Register an RPC method handler
   */
  registerMethod<TReq = any, TRes = any>(
    method: string,
    handler: (data: TReq, caller: Participant) => Promise<TRes> | TRes
  ): void;

  /**
   * Unregister an RPC method handler
   */
  unregisterMethod(method: string): void;

  /**
   * Call an RPC method on a remote participant
   */
  callMethod<TReq = any, TRes = any>(
    destinationIdentity: string,
    method: string,
    data: TReq,
    options?: RpcCallOptions
  ): Promise<TRes>;

  /**
   * Call an RPC method on all participants
   */
  broadcastMethod<TReq = any>(
    method: string,
    data: TReq,
    options?: Omit<RpcCallOptions, "waitForResponse">
  ): Promise<void>;
}
