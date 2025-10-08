export type SessionStatus =
  | "IDLE"
  | "CALLING" // Caller initiated, waiting for acceptance
  | "RINGING" // Incoming call (callee perspective)
  | "ACCEPTED" // Call accepted but not yet joined media
  | "AWAITING_JOIN_INFO" // Waiting for join credentials
  | "READY_TO_JOIN" // Has join-info but not connected to media
  | "CONNECTING" // Joining LiveKit room
  | "ACTIVE" // Successfully connected to the media session
  | "ENDED";

export interface ParticipantInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  email?: string;
}

export interface Participant {
  id: string;
  info?: ParticipantInfo;
  // Call state
  role: "CALLER" | "CALLEE" | "HOST" | "MEMBER";
  // Media state
  audioEnabled: boolean;
  videoEnabled: boolean;
  isSpeaking: boolean;
  connectionQuality?: "excellent" | "good" | "poor" | "lost" | "unknown";
  // Timestamps
  joinedAt: number;
}

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

export interface LiveKitJoinInfo {
  token: string;
  roomName: string;
  callId: string;
  url?: string;
}

export interface RtcError {
  code: string;
  message: string;
  timestamp: number;
  context?: any;
}

export interface TrackReference {
  participant: Participant;
  publication: import("livekit-client").TrackPublication;
  source: import("livekit-client").Track.Source;
  track?: import("livekit-client").Track;
}

export interface RtcState {
  session: {
    id?: string;
    status: SessionStatus;
    mode?: "AUDIO" | "VIDEO";
    livekitInfo?: LiveKitJoinInfo;
    // Identity context: how did I get into this call?
    myRole?: "CALLER" | "CALLEE";
    initiatedByMe: boolean;
  };

  room: {
    participants: Record<string, Participant>;
  };

  local: {
    audioEnabled: boolean;
    videoEnabled: boolean;
    screenEnabled: boolean;
  };

  connection: {
    connected: boolean;
    reconnecting: boolean;
    quality?: "excellent" | "good" | "poor" | "lost";
  };

  devices: DeviceState;
  errors: RtcError[];
}

export const defaultState: RtcState = {
  session: { status: "IDLE", initiatedByMe: false },
  room: {
    participants: {},
  },
  local: { audioEnabled: false, videoEnabled: false, screenEnabled: false },
  connection: { connected: false, reconnecting: false },
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
};
