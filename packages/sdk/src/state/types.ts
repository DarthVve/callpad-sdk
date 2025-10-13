export interface ParticipantMetadata {
  userId: string;
  role: "HOST" | "PARTICIPANT" | "GUEST";
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  profilePhoto: string;
}

export interface LiveKitJoinInfo {
  token: string;
  roomName: string;
  url: string;
}

export interface Session {
  id: string;
  status: "pending" | "ready" | "active" | "ended";
  mode: "AUDIO" | "VIDEO";
  role: "HOST" | "PARTICIPANT" | "GUEST";
  livekitInfo?: LiveKitJoinInfo;
}

export interface IncomingInvite {
  callId: string;
  caller: ParticipantMetadata;
  mode: "AUDIO" | "VIDEO";
  expiresAt: string;
  expiresInMs: number;
}

export interface OutgoingInvite {
  userId: string;
  status: "sent" | "accepted" | "declined" | "missed";
  participant: ParticipantMetadata;
}

export interface RtcError {
  code: string;
  message: string;
  timestamp: number;
  context?: any;
}

export interface RtcState {
  // Did we initiate the current call?
  initiated: boolean;

  // Active session (null when no active call)
  session: Session | null;

  // Incoming invitation (null when no pending invite)
  incomingInvite: IncomingInvite | null;

  outgoingInvites: Record<string, OutgoingInvite>;

  // Error tracking
  errors: RtcError[];
}

export const defaultState: RtcState = {
  initiated: false,
  session: null,
  incomingInvite: null,
  outgoingInvites: {},
  errors: [],
};
