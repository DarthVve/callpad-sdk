export type SessionStatus =
  | "IDLE"
  | "CALLING"        // Caller initiated, waiting for acceptance
  | "RINGING"        // Incoming call (callee perspective)
  | "ACCEPTED"       // Call accepted but not yet joined media
  | "AWAITING_JOIN_INFO"  // Waiting for join credentials
  | "READY_TO_JOIN"  // Has join-info but not connected to media
  | "CONNECTING"     // Joining LiveKit room
  | "ACTIVE"         // Successfully connected to media session
  | "ENDED";

// Unified Participant interface - combines all participant data
export interface Participant {
  id: string;
  // Profile data
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  // Call state
  role: "CALLER" | "CALLEE" | "HOST" | "MEMBER";
  callState: "INVITED" | "RINGING" | "JOINED" | "LEFT";
  // Media state
  audioEnabled: boolean;
  videoEnabled: boolean;
  isSpeaking: boolean;
  connectionQuality?: "excellent" | "good" | "poor" | "lost" | "unknown";
  // Timestamps
  invitedAt?: number;
  joinedAt?: number;
  leftAt?: number;
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
  url?: string;
}

export interface RtcError {
  code: string;
  message: string;
  timestamp: number;
  context?: any;
}

export type AutoJoinStatus = "idle" | "pending" | "retrying" | "succeeded" | "failed";

export interface AutoJoinState {
  status: AutoJoinStatus;
  attempt: number;
  maxAttempts: number;
  lastError?: string;
  startedAt?: number;
  completedAt?: number;
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
    participants: Record<string, Participant>; // Single unified record
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

  autoJoin: AutoJoinState;
  devices: DeviceState;
  errors: RtcError[];
  incomingCall: IncomingCallInfo | undefined;
}

export const defaultState: RtcState = {
  session: { status: "IDLE", initiatedByMe: false },
  room: {
    participants: {},
  },
  local: { audioEnabled: false, videoEnabled: false, screenEnabled: false },
  connection: { connected: false, reconnecting: false },
  autoJoin: {
    status: "idle",
    attempt: 0,
    maxAttempts: 0,
  },
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
