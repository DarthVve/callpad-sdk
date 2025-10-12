import { useRtcStore } from "../state/store";

export function useCallInitiated(): boolean {
  return useRtcStore((state) => state.initiated);
}
