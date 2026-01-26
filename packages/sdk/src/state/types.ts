type Nullable<T> = T | null;

export type CallParticipantRole = "HOST" | "PARTICIPANT" | "GUEST";

export interface Profile {
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePhoto: string | null;
}

export interface ParticipantPermissions {
  canMute: boolean;
  canKick: boolean;
  canTransfer: boolean;
  canEnd: boolean;
  canRecord: boolean;
  canShareScreen: boolean;
}

export interface ParticipantMetadata {
  userId: string | number;
  firstName: Nullable<string>;
  lastName: Nullable<string>;
  username: Nullable<string>;
  email: Nullable<string>;
  profilePhoto: Nullable<string>;
  role: CallParticipantRole;
  permissions: ParticipantPermissions;
}

export interface LiveKitJoinInfo {
  token: string;
  roomName: string;
  url: string;
}

export interface RecordingInfo {
  recordingId: string;
  egressId: string;
  startedAt: string;
  initiatedBy?: string;
}

export type SessionType = "CALL" | "MEETING";

export interface MeetingInfo {
  meetingId: string;
  meetingCode: string;
}

export interface Session {
  id: string;
  status: "initializing" | "pending" | "ready" | "active" | "ended";
  mode: "AUDIO" | "VIDEO";
  role: "HOST" | "PARTICIPANT" | "GUEST";
  livekitInfo?: LiveKitJoinInfo;
  startedAt?: string;
  ringTimeoutMs?: number;
  recording?: RecordingInfo | null;
  sessionType?: SessionType;
  meetingInfo?: MeetingInfo;
}

export interface IncomingInvite {
  callId: string;
  inviteId: string;
  caller: ParticipantMetadata;
  mode: "AUDIO" | "VIDEO";
  expiresAt: string;
  expiresInMs: number;
  ringTimeoutMs: number;
}

export interface OutgoingInvite {
  userId: string;
  status: "sent" | "accepted" | "declined" | "missed";
  participant?: Omit<ParticipantMetadata, "permissions"> | undefined;
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

import type { Participant } from "livekit-client";

export interface ParticipantListOptions {
  pageSize?: number;
  includeLocalParticipant?: boolean;
  sortBy?: "speaking" | "name" | "raised-hand";
}

export interface ParticipantListReturn {
  participants: Participant[];
  pinnedParticipants: Participant[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalParticipants: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  togglePin: (participantId: string) => void;
  clearPinned: () => void;
  isPinned: (participantId: string) => boolean;
}
