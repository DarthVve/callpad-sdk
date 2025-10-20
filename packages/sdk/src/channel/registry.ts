import type { Room } from "livekit-client";
import { ChatService, useChatStore } from "./chat";
import type { RealtimeFeature } from "./types";

export const FEATURES: Record<string, RealtimeFeature> = {
  chat: {
    name: "chat",
    createService: (room: Room) => new ChatService(room),
    cleanupStore: () => useChatStore.getState().clearChat(),
  },
};

export const DEFAULT_FEATURES = ["chat"];
