export type SessionStatus =
  | "IDLE"
  | "RINGING"
  | "ACCEPTED"
  | "AWAITING_JOIN_INFO"
  | "ACTIVE"
  | "ENDED";

// Simple participant profile from API/Socket
export interface Profile {
  id: string;
  firstName: string | undefined;
  lastName: string | undefined;
  avatarUrl: string | undefined;
}

// Participant presence/status information
export interface Presence {
  role?: "CALLER" | "CALLEE" | "HOST" | "MEMBER";
  invite: "INVITED" | "ACCEPTED" | "DECLINED" | "MISSED";
  join: "NOT_JOINED" | "JOINING" | "JOINED" | "LEFT";
  invitedAt?: number;
  acceptedAt?: number;
  joinedAt?: number;
  leftAt?: number;
}

// Media state from LiveKit
export interface MediaSummary {
  isSpeaking: boolean;
  connectionQuality?: "excellent" | "good" | "poor" | "lost";
}

// Merged view for UI consumption
export interface ParticipantView {
  id: string;
  firstName: string | undefined;
  lastName: string | undefined;
  avatarUrl: string | undefined;
  role: "CALLER" | "CALLEE" | "HOST" | "MEMBER" | undefined;
  invite: "INVITED" | "ACCEPTED" | "DECLINED" | "MISSED";
  join: "NOT_JOINED" | "JOINING" | "JOINED" | "LEFT";
  isSpeaking: boolean;
  connectionQuality: "excellent" | "good" | "poor" | "lost" | undefined;
}

// Removed - use ParticipantView with presence/profile/media instead

export type PermissionStatus = "granted" | "denied" | "prompt" | "unknown";

export interface DeviceState {
  mics: MediaDeviceInfo[];
  cams: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
  selected: {
    micId: string | undefined;
    camId: string | undefined;
    speakerId: string | undefined;
  };
  permissions: {
    camera: PermissionStatus;
    microphone: PermissionStatus;
  };
  isEnumerating: boolean;
  lastEnumeratedAt: number | undefined;
}

export interface IncomingCallInfo {
  callId: string;
  caller: {
    id: string;
    name: string;
    avatarUrl: string | undefined;
  };
  type: "AUDIO" | "VIDEO";
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
    mode?: "AUDIO" | "VIDEO";
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

  // Participant management
  profiles: Record<string, Profile>;
  presence: Record<string, Presence>;
  media: Record<string, MediaSummary>;

  // Device management
  devices: DeviceState;
  errors: RtcError[];
  incomingCall: IncomingCallInfo | undefined;
}

export const defaultState: RtcState = {
  session: { status: "IDLE" },
  connection: { connected: false, reconnecting: false },
  local: { audioEnabled: false, videoEnabled: false, screenEnabled: false },
  profiles: {},
  presence: {},
  media: {},
  devices: {
    mics: [],
    cams: [],
    speakers: [],
    selected: {
      micId: undefined,
      camId: undefined,
      speakerId: undefined,
    },
    permissions: {
      camera: "unknown",
      microphone: "unknown",
    },
    isEnumerating: false,
    lastEnumeratedAt: undefined,
  },
  errors: [],
  incomingCall: undefined,
};
