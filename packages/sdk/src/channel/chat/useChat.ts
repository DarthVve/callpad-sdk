import { useCallback, useMemo } from "react";
import type { ParticipantMetadata } from "../../state/types";
import { useFeatureService } from "../DataChannelContext";
import type { ChatService } from "./service";
import { useChatStore } from "./store";
import type { ChatEntry } from "./types";
import { compareEntries } from "./utils";

type Nullable<T> = T | null;

export interface UseChatReturn {
  entries: ChatEntry[];
  isReady: boolean;
  getParticipantInfo: (id: string) => Nullable<ParticipantMetadata>;
  isOwnEntry: (entry: ChatEntry) => boolean;
  send: (content: string) => Promise<void>;
  edit: (id: string, content: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  react: (id: string, emoji: string) => Promise<void>;
  unreact: (id: string, emoji: string) => Promise<void>;
}

export function useChat(): UseChatReturn {
  const service = useFeatureService<ChatService>("chat");

  const byId = useChatStore((state) => state.byId);
  const order = useChatStore((state) => state.order);
  const participantCache = useChatStore((state) => state.participantCache);

  const entries = useMemo(() => {
    return order
      .map((id) => byId[id])
      .filter((entry): entry is ChatEntry => entry !== undefined)
      .sort(compareEntries);
  }, [byId, order]);

  const getParticipantInfo = useCallback(
    (id: string): Nullable<ParticipantMetadata> => {
      return participantCache[id] || null;
    },
    [participantCache]
  );

  const send = useCallback(
    async (content: string) => service.send(content),
    [service]
  );

  const edit = useCallback(
    async (id: string, content: string) => service.edit(id, content),
    [service]
  );

  const remove = useCallback(
    async (id: string) => service.remove(id),
    [service]
  );

  const react = useCallback(
    async (id: string, emoji: string) => service.react(id, emoji),
    [service]
  );

  const unreact = useCallback(
    async (id: string, emoji: string) => service.unreact(id, emoji),
    [service]
  );

  const isOwnEntry = useCallback(
    (entry: ChatEntry) => entry.sender.id === service.getLocalParticipantId(),
    [service]
  );

  return {
    entries,
    isReady: true,
    getParticipantInfo,
    isOwnEntry,
    send,
    edit,
    remove,
    react,
    unreact,
  };
}
