import type { ParticipantMetadata } from "../../state/types";

export type EnvelopeKind = "entry" | "edit" | "remove" | "reaction";

export interface EnvelopeBase {
  v: 1;
  kind: EnvelopeKind;
  roomId: string;
  entryId: string;
  ts: number;
  sender: {
    sid: string;
    identity: string;
    info?: ParticipantMetadata;
  };
}

export interface EntryPayload {
  content: string;
  meta?: Record<string, any>;
}

export interface EditPayload {
  newContent: string;
  version: number;
}

export interface ReactionPayload {
  emoji: string;
  op: "add" | "remove";
}

export type Envelope =
  | (EnvelopeBase & { kind: "entry"; payload: EntryPayload })
  | (EnvelopeBase & { kind: "edit"; payload: EditPayload })
  | (EnvelopeBase & { kind: "remove" })
  | (EnvelopeBase & { kind: "reaction"; payload: ReactionPayload });

export type ChatEntryStatus = "sending" | "sent" | "failed";

export interface ChatEntry {
  id: string;
  content: string;
  sender: {
    sid: string;
    identity: string;
    info?: ParticipantMetadata;
  };
  createdAt: number;
  editedAt?: number;
  removedAt?: number;
  version: number;
  reactions: Record<string, Set<string>>;
  status: ChatEntryStatus;
}

export interface ChatState {
  byId: Record<string, ChatEntry>;
  order: string[];
  pendingOps: Record<string, Envelope[]>;
  maxEntries: number;
}
