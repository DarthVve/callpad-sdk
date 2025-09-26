export type SessionStatus =
  | "idle"
  | "ringing"
  | "accepted"
  | "awaiting_join_info"
  | "active"
  | "ended";

export interface ParticipantState {
  id: string;
  name?: string;
  isLocal: boolean;
  isSpeaking: boolean;
  audioMuted: boolean;
  videoMuted: boolean;
  metadata?: any;
}

export interface TrackState {
  sid: string;
  participantId: string;
  kind: "audio" | "video" | "screen";
}

export interface DeviceState {
  mics: MediaDeviceInfo[];
  cams: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
  selected: {
    micId?: string;
    camId?: string;
    speakerId?: string;
  };
}

export interface IncomingCallInfo {
  callId: string;
  caller: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  type: "audio" | "video";
  timestamp: number;
}

export interface LiveKitJoinInfo {
  token: string;
  roomName: string;
  callId: string;
}

export interface RtcError {
  code: string;
  message: string;
  timestamp: number;
  context?: any;
}

export interface RtcState {
  session: {
    id?: string;
    status: SessionStatus;
    roomName?: string;
    mode?: "audio" | "video";
    livekitInfo?: LiveKitJoinInfo;
  };

  connection: {
    connected: boolean;
    reconnecting: boolean;
    quality?: "excellent" | "good" | "poor" | "lost";
  };

  local: {
    audioEnabled: boolean;
    videoEnabled: boolean;
    screenEnabled: boolean;
  };

  participants: Record<string, ParticipantState>;
  tracks: Record<string, TrackState>;
  devices: DeviceState;
  errors: RtcError[];
  incomingCall?: IncomingCallInfo;
}

export const defaultState: RtcState = {
  session: { status: "idle" },
  connection: { connected: false, reconnecting: false },
  local: { audioEnabled: false, videoEnabled: false, screenEnabled: false },
  participants: {},
  tracks: {},
  devices: { mics: [], cams: [], speakers: [], selected: {} },
  errors: [],
};
