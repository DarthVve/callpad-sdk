import { useCallback } from "react";
import { createLogger } from "../../utils";
import { useFeatureService } from "../DataChannelContext";
import type { SpotlightService } from "./service";
import { useSpotlightStore } from "./store";
import type { SpotlightedUser } from "./types";
import { ParticipantMetadata } from "../../state/types";

const logger = createLogger("spotlight:hook");

type Nullable<T> = T | null;

export interface IUseSpotlight {
  spotlight: (targetId: string) => Promise<void>;
  unspotlight: () => Promise<void>;
  getSpotlightedUser: () => Nullable<SpotlightedUser>;
  isSpotlighted: boolean;
  isReady: boolean;
}

export function useSpotlight(): IUseSpotlight {
  const service = useFeatureService<SpotlightService>("spotlight");

  const getSpotlightedUser = useSpotlightStore(
    (state) => state.getSpotlightedUser
  );
  const isSpotlighted = useSpotlightStore((state) => state.isSpotlighted);

  const spotlight = useCallback(
    async (targetId: string, info?: ParticipantMetadata) => {
      if (!service) {
        logger.error("Cannot spotlight: service not ready");
        return;
      }
      return service.spotlight(targetId, info!);
    },
    [service]
  );

  const unspotlight = useCallback(async () => {
    if (!service) {
      logger.error("Cannot unspotlight: service not ready");
      return;
    }
    return service.unspotlight();
  }, [service]);

  return {
    spotlight,
    unspotlight,
    getSpotlightedUser,
    isSpotlighted,
    isReady: !!service,
  };
}

