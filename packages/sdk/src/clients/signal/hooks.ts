import { useSdk } from "../../provider/RtcProvider";
import type { SignalClient } from "./client";

/**
 * Hook to access the Signal client directly from the SDK
 * @returns The SignalClient instance
 */
export function useSignalClient(): SignalClient {
  const sdk = useSdk();
  return sdk.signal;
}