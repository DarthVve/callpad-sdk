export type PresenceStatus = "online" | "offline" | "busy";

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  deviceCount: number;
  lastUpdated: number;
}

export interface PresenceConfig {
  pingIntervalMs: number;
  cacheTtlMs: number;
}

export const DEFAULT_PRESENCE_CONFIG: PresenceConfig = {
  pingIntervalMs: 30_000,
  cacheTtlMs: 60_000,
};
