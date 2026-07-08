import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ChatEntry, ChatState, Envelope } from "./types";

interface ChatActions {
  patch: (fn: (draft: ChatState) => void) => void;
  applyIncoming: (envelope: Envelope) => void;
  addFile: (file: File, filename: string) => void;
  addEntryOptimistic: (entry: ChatEntry) => void;
  markEntrySent: (entryId: string) => void;
  markEntryFailed: (entryId: string) => void;
  applyEdit: (entryId: string, newContent: string, version: number) => void;
  applyRemove: (entryId: string) => void;
  applyReaction: (
    entryId: string,
    emoji: string,
    participantId: string,
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
  participantCache: {},
  maxEntries: 1000,
};

function applyReactionToEntry(
  entry: ChatEntry,
  emoji: string,
  participantId: string,
  op: "add" | "remove"
) {
  const emojiSet = entry.reactions[emoji];
  if (!emojiSet) {
    entry.reactions[emoji] = new Set();
  }
  if (op === "add") {
    entry.reactions[emoji]?.add(participantId);
  } else {
    entry.reactions[emoji]?.delete(participantId);
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

    patch: (fn) =>
      set((state) => {
        fn(state);
      }),

    applyIncoming: (envelope) =>
      set((state) => {
        if (envelope.kind === "entry") {
          if (state.byId[envelope.entryId]) {
            return;
          }

          if (envelope.sender.info) {
            state.participantCache[envelope.sender.id] = envelope.sender.info;
          }

          const entry: ChatEntry = {
            id: envelope.entryId,
            content: envelope.payload.content,
            sender: {
              id: envelope.sender.id,
            },
            createdAt: envelope.ts,
            version: 1,
            reactions: {},
            status: "sent",
            filename: envelope.payload?.meta?.filename,
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
                if (op.sender.info) {
                  state.participantCache[op.sender.id] = op.sender.info;
                }

                const entry = state.byId[op.entryId];
                if (entry) {
                  applyReactionToEntry(
                    entry,
                    op.payload.emoji,
                    op.sender.id,
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
          if (envelope.sender.info) {
            state.participantCache[envelope.sender.id] = envelope.sender.info;
          }

          const entry = state.byId[envelope.entryId];
          if (entry) {
            applyReactionToEntry(
              entry,
              envelope.payload.emoji,
              envelope.sender.id,
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

    addFile: (file, filename) =>
      set((state) => {
        const values = Object.values(state.byId);
        const entryArr = values.filter((val) => val.filename === filename);
        const entry = entryArr[0];
        entry!.file = file;
        state.byId[entry!.id] = entry!;
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

    applyReaction: (entryId, emoji, participantId, op) =>
      set((state) => {
        const entry = state.byId[entryId];
        if (entry) {
          applyReactionToEntry(entry, emoji, participantId, op);
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
            if (envelope.sender.info) {
              state.participantCache[envelope.sender.id] = envelope.sender.info;
            }

            const entry = state.byId[envelope.entryId];
            if (entry) {
              applyReactionToEntry(
                entry,
                envelope.payload.emoji,
                envelope.sender.id,
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
