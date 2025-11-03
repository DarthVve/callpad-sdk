import { useCallback, useMemo } from "react";
import { createLogger } from "../../utils";
import { useFeatureService } from "../DataChannelContext";
import type { RaiseHandService } from "./service";
import { useRaiseHandStore } from "./store";

const logger = createLogger("raise-hand:hook");

type Nullable<T> = T | null;

export interface RaisedHandInfo {
  participantId: string;
  order: number;
  ts: number;
}

export interface UseRaiseHandReturn {
  raiseHand: () => Promise<void>;
  lowerHand: (participantId?: string) => Promise<void>;
  lowerAllHands: () => Promise<void>;
  isHandRaised: (participantId: string) => boolean;
  getRaisedHandOrder: (participantId: string) => Nullable<number>;
  getRaisedHands: () => RaisedHandInfo[];
  isReady: boolean;
}

export function useRaiseHand(): UseRaiseHandReturn {
  const service = useFeatureService<RaiseHandService>("raise-hand");

  const raisedHands = useRaiseHandStore((state) => state.raisedHands);
  const isHandRaised = useRaiseHandStore((state) => state.isHandRaised);
  const getRaisedHandOrder = useRaiseHandStore(
    (state) => state.getRaisedHandOrder
  );

  const raiseHand = useCallback(async () => {
    if (!service) {
      logger.error("Cannot raise hand: service not ready");
      return;
    }
    return service.raiseHand();
  }, [service]);

  const lowerHand = useCallback(
    async (participantId?: string) => {
      if (!service) {
        logger.error("Cannot lower hand: service not ready");
        return;
      }
      return service.lowerHand(participantId);
    },
    [service]
  );

  const lowerAllHands = useCallback(async () => {
    if (!service) {
      logger.error("Cannot lower all hands: service not ready");
      return;
    }
    return service.lowerAllHands();
  }, [service]);

  const getRaisedHands = useCallback((): RaisedHandInfo[] => {
    const hands: RaisedHandInfo[] = [];
    for (const [participantId, hand] of raisedHands.entries()) {
      hands.push({
        participantId,
        order: hand.order,
        ts: hand.ts,
      });
    }
    return hands.sort((a, b) => a.order - b.order);
  }, [raisedHands]);

  return {
    raiseHand,
    lowerHand,
    lowerAllHands,
    isHandRaised,
    getRaisedHandOrder,
    getRaisedHands,
    isReady: !!service,
  };
}
