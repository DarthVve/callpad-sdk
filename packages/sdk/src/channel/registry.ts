import type { Room } from "livekit-client";
import { ChatService, useChatStore } from "./chat";
import { RaiseHandService, useRaiseHandStore } from "./raiseHand";
import { ReactionsService, useReactionsStore } from "./reactions";
import type { RealtimeFeature } from "./types";

export const FEATURES: Record<string, RealtimeFeature> = {
  chat: {
    name: "chat",
    createService: (room: Room) => new ChatService(room),
    cleanupStore: () => useChatStore.getState().clearChat(),
  },
  reactions: {
    name: "reactions",
    createService: (room: Room) => new ReactionsService(room),
    cleanupStore: () => useReactionsStore.getState().clear(),
  },
  "raise-hand": {
    name: "raise-hand",
    createService: (room: Room) => new RaiseHandService(room),
    cleanupStore: () => useRaiseHandStore.getState().clear(),
  },
};

export const DEFAULT_FEATURES = ["chat", "reactions", "raise-hand"];
