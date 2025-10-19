import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ChatEntry, ChatState, Envelope } from "./types";

interface ChatActions {
  applyIncoming: (envelope: Envelope) => void;
  addEntryOptimistic: (entry: ChatEntry) => void;
  markEntrySent: (entryId: string) => void;
  markEntryFailed: (entryId: string) => void;
  applyEdit: (entryId: string, newContent: string, version: number) => void;
  applyRemove: (entryId: string) => void;
  applyReaction: (
    entryId: string,
    emoji: string,
    participantSid: string,
    op: "add" | "remove"
  ) => void;
  queuePendingOp: (entryId: string, envelope: Envelope) => void;
  processPendingOps: (entryId: string) => void;
  trimOldEntries: () => void;
  clearChat: () => void;
}

const defaultChatState: ChatState = {
  byId: {},
  order: [],
  pendingOps: {},
  maxEntries: 1000,
};

function applyReactionToEntry(
  entry: ChatEntry,
  emoji: string,
  participantSid: string,
  op: "add" | "remove"
) {
  const emojiSet = entry.reactions[emoji];
  if (!emojiSet) {
    entry.reactions[emoji] = new Set();
  }
  if (op === "add") {
    entry.reactions[emoji]?.add(participantSid);
  } else {
    entry.reactions[emoji]?.delete(participantSid);
    if (entry.reactions[emoji]?.size === 0) {
      delete entry.reactions[emoji];
    }
  }
}

function trimEntriesIfNeeded(state: ChatState) {
  if (Object.keys(state.byId).length > state.maxEntries) {
    const entriesToRemove = Object.keys(state.byId).length - state.maxEntries;
    for (let i = 0; i < entriesToRemove; i++) {
      const oldestId = state.order[i];
      if (oldestId) {
        delete state.byId[oldestId];
      }
    }
    state.order = state.order.slice(entriesToRemove);
  }
}

export const useChatStore = create<ChatState & ChatActions>()(
  immer((set) => ({
    ...defaultChatState,

    applyIncoming: (envelope) =>
      set((state) => {
        if (envelope.kind === "entry") {
          if (state.byId[envelope.entryId]) {
            return;
          }

          const entry: ChatEntry = {
            id: envelope.entryId,
            content: envelope.payload.content,
            sender: envelope.sender,
            createdAt: envelope.ts,
            version: 1,
            reactions: {},
            status: "sent",
          };

          state.byId[envelope.entryId] = entry;
          state.order.push(envelope.entryId);

          trimEntriesIfNeeded(state);

          const pendingOps = state.pendingOps[envelope.entryId];
          if (pendingOps) {
            delete state.pendingOps[envelope.entryId];

            for (const op of pendingOps) {
              if (op.kind === "edit") {
                const entry = state.byId[op.entryId];
                if (entry && op.payload.version > entry.version) {
                  entry.content = op.payload.newContent;
                  entry.version = op.payload.version;
                  entry.editedAt = op.ts;
                }
              } else if (op.kind === "remove") {
                const entry = state.byId[op.entryId];
                if (entry && !entry.removedAt) {
                  entry.removedAt = op.ts;
                }
              } else if (op.kind === "reaction") {
                const entry = state.byId[op.entryId];
                if (entry) {
                  applyReactionToEntry(
                    entry,
                    op.payload.emoji,
                    op.sender.sid,
                    op.payload.op
                  );
                }
              }
            }
          }
        } else if (envelope.kind === "edit") {
          const entry = state.byId[envelope.entryId];
          if (entry) {
            if (envelope.payload.version > entry.version) {
              entry.content = envelope.payload.newContent;
              entry.version = envelope.payload.version;
              entry.editedAt = envelope.ts;
            }
          } else {
            if (!state.pendingOps[envelope.entryId]) {
              state.pendingOps[envelope.entryId] = [];
            }
            state.pendingOps[envelope.entryId]?.push(envelope);
          }
        } else if (envelope.kind === "remove") {
          const entry = state.byId[envelope.entryId];
          if (entry) {
            if (!entry.removedAt) {
              entry.removedAt = envelope.ts;
            }
          } else {
            if (!state.pendingOps[envelope.entryId]) {
              state.pendingOps[envelope.entryId] = [];
            }
            state.pendingOps[envelope.entryId]?.push(envelope);
          }
        } else if (envelope.kind === "reaction") {
          const entry = state.byId[envelope.entryId];
          if (entry) {
            applyReactionToEntry(
              entry,
              envelope.payload.emoji,
              envelope.sender.sid,
              envelope.payload.op
            );
          } else {
            if (!state.pendingOps[envelope.entryId]) {
              state.pendingOps[envelope.entryId] = [];
            }
            state.pendingOps[envelope.entryId]?.push(envelope);
          }
        }
      }),

    addEntryOptimistic: (entry) =>
      set((state) => {
        state.byId[entry.id] = entry;
        state.order.push(entry.id);

        trimEntriesIfNeeded(state);
      }),

    markEntrySent: (entryId) =>
      set((state) => {
        const entry = state.byId[entryId];
        if (entry) {
          entry.status = "sent";
        }
      }),

    markEntryFailed: (entryId) =>
      set((state) => {
        const entry = state.byId[entryId];
        if (entry) {
          entry.status = "failed";
        }
      }),

    applyEdit: (entryId, newContent, version) =>
      set((state) => {
        const entry = state.byId[entryId];
        if (entry && version > entry.version) {
          entry.content = newContent;
          entry.version = version;
          entry.editedAt = Date.now();
        }
      }),

    applyRemove: (entryId) =>
      set((state) => {
        const entry = state.byId[entryId];
        if (entry && !entry.removedAt) {
          entry.removedAt = Date.now();
        }
      }),

    applyReaction: (entryId, emoji, participantSid, op) =>
      set((state) => {
        const entry = state.byId[entryId];
        if (entry) {
          applyReactionToEntry(entry, emoji, participantSid, op);
        }
      }),

    queuePendingOp: (entryId, envelope) =>
      set((state) => {
        if (!state.pendingOps[entryId]) {
          state.pendingOps[entryId] = [];
        }
        state.pendingOps[entryId].push(envelope);
      }),

    processPendingOps: (entryId) =>
      set((state) => {
        const pendingOps = state.pendingOps[entryId];
        if (!pendingOps) {
          return;
        }

        delete state.pendingOps[entryId];

        for (const envelope of pendingOps) {
          if (envelope.kind === "edit") {
            const entry = state.byId[envelope.entryId];
            if (entry && envelope.payload.version > entry.version) {
              entry.content = envelope.payload.newContent;
              entry.version = envelope.payload.version;
              entry.editedAt = envelope.ts;
            }
          } else if (envelope.kind === "remove") {
            const entry = state.byId[envelope.entryId];
            if (entry && !entry.removedAt) {
              entry.removedAt = envelope.ts;
            }
          } else if (envelope.kind === "reaction") {
            const entry = state.byId[envelope.entryId];
            if (entry) {
              applyReactionToEntry(
                entry,
                envelope.payload.emoji,
                envelope.sender.sid,
                envelope.payload.op
              );
            }
          }
        }
      }),

    trimOldEntries: () =>
      set((state) => {
        trimEntriesIfNeeded(state);
      }),

    clearChat: () => set(() => defaultChatState),
  }))
);

export const chatStore = useChatStore;
