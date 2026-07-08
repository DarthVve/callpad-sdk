import { useCallback } from "react";
import type { ParticipantMetadata } from "../../state/types";
import { createLogger } from "../../utils";
import { useFeatureService } from "../DataChannelContext";
import type { ReactionsService } from "./service";
import { useReactionsStore } from "./store";

const logger = createLogger("reactions:hook");

type Nullable<T> = T | null;

export interface UseReactionsReturn {
  sendReaction: (emoji: string) => Promise<void>;
  getReactionFor: (participantId: string) => Nullable<string>;
  clearReaction: (participantId: string) => void;
  getParticipantInfo: (id: string) => Nullable<ParticipantMetadata>;
  isReady: boolean;
}

export function useReactions(): UseReactionsReturn {
  const service = useFeatureService<ReactionsService>("reactions");

  const reactions = useReactionsStore((state) => state.reactions);
  const participantCache = useReactionsStore((state) => state.participantCache);

  const getReactionFor = useCallback(
    (participantId: string): Nullable<string> => {
      const reaction = reactions.get(participantId);
      return reaction?.emoji ?? null;
    },
    [reactions]
  );

  const getParticipantInfo = useCallback(
    (id: string): Nullable<ParticipantMetadata> => participantCache[id] || null,
    [participantCache]
  );

  const sendReaction = useCallback(
    async (emoji: string) => {
      if (!service) {
        logger.error("Cannot send reaction: service not ready");
        return;
      }
      return service.sendReaction(emoji);
    },
    [service]
  );

  const clearReaction = useCallback((participantId: string) => {
    useReactionsStore.getState().clearReaction(participantId);
  }, []);

  return {
    sendReaction,
    getReactionFor,
    clearReaction,
    getParticipantInfo,
    isReady: !!service,
  };
}
