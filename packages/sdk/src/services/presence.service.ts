import type { Socket } from "socket.io-client";
import { SignalPresenceService } from "../clients/signal";
import type { PresenceConfig, UserPresence } from "../state/presence.types";
import { DEFAULT_PRESENCE_CONFIG } from "../state/presence.types";
import { createLogger } from "../utils";

export interface PresenceServiceConfig {
  appId: string;
}

export interface PresenceServiceDependencies {
  getSocket: () => Socket | null;
}

export interface PresenceServiceInstance {
  startPing: () => void;
  stopPing: () => void;
  queryPresence: (userIds: string[]) => Promise<UserPresence[]>;
  getPresence: (userId: string) => Promise<UserPresence | undefined>;
  configure: (config: Partial<PresenceConfig>) => void;
  destroy: () => void;
}

export function createPresenceService(
  config: PresenceServiceConfig,
  deps: PresenceServiceDependencies
): PresenceServiceInstance {
  const logger = createLogger("presence");
  const signalPresence = new SignalPresenceService(config.appId);

  let pingIntervalId: ReturnType<typeof setInterval> | null = null;
  let presenceConfig: PresenceConfig = { ...DEFAULT_PRESENCE_CONFIG };
  const inFlight = new Map<string, Promise<UserPresence[] | undefined>>();

  function startPing(): void {
    if (pingIntervalId) {
      logger.debug("Ping already running");
      return;
    }

    const emitPing = () => {
      const socket = deps.getSocket();
      if (socket?.connected) {
        socket.emit("presence:ping");
        logger.debug("Emitted presence:ping");
      }
    };

    emitPing();
    pingIntervalId = setInterval(emitPing, presenceConfig.pingIntervalMs);

    logger.info("Started presence ping", {
      intervalMs: presenceConfig.pingIntervalMs,
    });
  }

  function stopPing(): void {
    if (pingIntervalId) {
      clearInterval(pingIntervalId);
      pingIntervalId = null;
      logger.info("Stopped presence ping");
    }
  }

  async function queryPresence(userIds: string[]): Promise<UserPresence[]> {
    if (userIds.length === 0) {
      return [];
    }

    const cacheKey = [...userIds].sort().join(",");

    const existing = inFlight.get(cacheKey);
    if (existing) {
      logger.debug("Reusing in-flight request", { cacheKey });
      return (await existing) ?? [];
    }

    const fetchPromise = (async (): Promise<UserPresence[] | undefined> => {
      try {
        const response = await signalPresence.queryPresence(userIds);

        return response.presence.map((p) => ({
          userId: p.userId,
          status: p.status,
          deviceCount: p.deviceCount,
          lastUpdated: Date.now(),
        }));
      } catch (error) {
        logger.error("Failed to fetch presence", { error, userIds });
        return undefined;
      } finally {
        inFlight.delete(cacheKey);
      }
    })();

    inFlight.set(cacheKey, fetchPromise);
    return (await fetchPromise) ?? [];
  }

  async function getPresence(userId: string): Promise<UserPresence | undefined> {
    const results = await queryPresence([userId]);
    return results[0];
  }

  function configure(config: Partial<PresenceConfig>): void {
    presenceConfig = { ...presenceConfig, ...config };

    if (pingIntervalId) {
      stopPing();
      startPing();
    }
  }

  function destroy(): void {
    stopPing();
    inFlight.clear();
    logger.debug("Presence service destroyed");
  }

  return {
    startPing,
    stopPing,
    queryPresence,
    getPresence,
    configure,
    destroy,
  };
}
