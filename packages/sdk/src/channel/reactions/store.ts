import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ParticipantMetadata } from "../../state/types";
import type { ParticipantReaction, ReactionEnvelope, ReactionsState } from "./types";

interface ReactionsActions {
  setReaction: (participantId: string, reaction: ParticipantReaction) => void;
  clearReaction: (participantId: string) => void;
  upsertParticipantInfo: (id: string, info: ParticipantMetadata) => void;
  pruneExpired: (now?: number) => void;
  clear: () => void;
}

const defaultState: ReactionsState = {
  reactions: new Map(),
  participantCache: {},
  ttlMs: 4000,
};

export const useReactionsStore = create<ReactionsState & ReactionsActions>()(
  immer((set) => ({
    ...defaultState,

    setReaction: (participantId, reaction) =>
      set((state) => {
        state.reactions.set(participantId, reaction);
      }),

    clearReaction: (participantId) =>
      set((state) => {
        state.reactions.delete(participantId);
      }),

    upsertParticipantInfo: (id, info) =>
      set((state) => {
        state.participantCache[id] = info;
      }),

    pruneExpired: (now = Date.now()) =>
      set((state) => {
        const entries = Array.from(state.reactions.entries());
        for (const [participantId, reaction] of entries) {
          if (reaction.ts + state.ttlMs < now) {
            state.reactions.delete(participantId);
          }
        }
      }),

    clear: () =>
      set(() => ({
        reactions: new Map(),
        participantCache: {},
        ttlMs: defaultState.ttlMs,
      })),
  }))
);

export function applyIncomingReaction(envelope: ReactionEnvelope): void {
  const { upsertParticipantInfo, setReaction } = useReactionsStore.getState();

  if (envelope.sender.info) {
    upsertParticipantInfo(envelope.sender.id, envelope.sender.info);
  }

  setReaction(envelope.sender.id, {
    emoji: envelope.payload.emoji,
    ts: Date.now(),
    nonce: envelope.payload.nonce,
  });
}
