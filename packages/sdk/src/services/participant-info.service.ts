import { CallsService } from "../generated/api";
import type { ParticipantInfo } from "../state/types";
import { createLogger } from "../utils/logger";

const logger = createLogger("participant-info");

export class ParticipantInfoService {
  private cache = new Map<string, ParticipantInfo>();
  private pendingRequests = new Map<string, Promise<ParticipantInfo>>();

  async getParticipantInfo(
    identity: string,
    appId: string
  ): Promise<ParticipantInfo> {
    if (this.cache.has(identity)) {
      return this.cache.get(identity)!;
    }

    if (this.pendingRequests.has(identity)) {
      return this.pendingRequests.get(identity)!;
    }

    const promise = this.fetchParticipantInfo(identity, appId);
    this.pendingRequests.set(identity, promise);

    try {
      const info = await promise;
      this.cache.set(identity, info);
      return info;
    } catch (error) {
      logger.error("Failed to fetch participant info", { identity, error });
      const fallbackInfo = { id: identity };
      this.cache.set(identity, fallbackInfo);
      return fallbackInfo;
    } finally {
      this.pendingRequests.delete(identity);
    }
  }

  private async fetchParticipantInfo(
    identity: string,
    appId: string
  ): Promise<ParticipantInfo> {
    const response = await CallsService.getSignalCallsParticipantsByIdentity({
      identity,
      appId,
    });
    return response;
  }

  clearCache(identity?: string): void {
    if (identity) {
      this.cache.delete(identity);
      this.pendingRequests.delete(identity);
    } else {
      this.cache.clear();
      this.pendingRequests.clear();
    }
  }

  getCachedInfo(identity: string): ParticipantInfo | undefined {
    return this.cache.get(identity);
  }
}
