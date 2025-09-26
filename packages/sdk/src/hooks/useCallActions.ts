import { useSdk } from "../provider/RtcProvider";
import type { CallActions } from "../services";

export function useCallActions(): CallActions {
  const sdk = useSdk();

  return {
    initiate: sdk.initiate,
    accept: sdk.accept,
    decline: sdk.decline,
    end: sdk.end,
  };
}

export type { CallActions };
