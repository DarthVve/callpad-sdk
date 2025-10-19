import { useMemo, useCallback } from "react";
import { useChatStore } from "./store";
import { useFeatureService } from "../DataChannelContext";
import { compareEntries } from "./utils";
import type { ChatService } from "./service";
import type { ChatEntry } from "./types";

export interface UseChatReturn {
  entries: ChatEntry[];
  isReady: boolean;
  isOwnEntry: (entry: ChatEntry) => boolean;
  send: (content: string) => Promise<void>;
  edit: (id: string, content: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  react: (id: string, emoji: string) => Promise<void>;
  unreact: (id: string, emoji: string) => Promise<void>;
}

export function useChat(): UseChatReturn {
  const service = useFeatureService<ChatService>("chat");
  
  const byId = useChatStore(state => state.byId);
  const order = useChatStore(state => state.order);

  const entries = useMemo(() => {
    return order
      .map(id => byId[id])
      .filter((entry): entry is ChatEntry => entry !== undefined)
      .sort(compareEntries);
  }, [byId, order]);

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
    (entry: ChatEntry) => entry.sender.sid === service.getLocalParticipantSid(),
    [service]
  );

  return {
    entries,
    isReady: true,
    isOwnEntry,
    send,
    edit,
    remove,
    react,
    unreact,
  };
}
