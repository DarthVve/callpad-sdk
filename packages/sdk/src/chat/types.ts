export type EnvelopeKind = "entry" | "edit" | "delete" | "reaction";

export interface EnvelopeBase {
  v: 1;
  kind: EnvelopeKind;
  roomId: string;
  entryId: string;
  ts: number;
  sender: {
    sid: string;
    userId?: string | number;
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

export interface DeletePayload {
  reason?: string;
}

export interface ReactionPayload {
  emoji: string;
  op: "add" | "remove";
}

export type Envelope =
  | (EnvelopeBase & { kind: "entry"; payload: EntryPayload })
  | (EnvelopeBase & { kind: "edit"; payload: EditPayload })
  | (EnvelopeBase & { kind: "delete"; payload: DeletePayload })
  | (EnvelopeBase & { kind: "reaction"; payload: ReactionPayload });

export type ChatEntryStatus = "sending" | "sent" | "failed";

export interface ChatEntry {
  id: string;
  content: string;
  sender: {
    sid: string;
    userId?: string | number;
  };
  createdAt: number;
  editedAt?: number;
  deletedAt?: number;
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
