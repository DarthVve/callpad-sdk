import type { Room } from "livekit-client";

export interface RealtimeFeature<TService = any> {
  name: string;
  createService(room: Room): TService;
  cleanupStore?(): void;
}
