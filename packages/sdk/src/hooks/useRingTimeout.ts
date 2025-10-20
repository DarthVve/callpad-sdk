import { useEffect } from "react";
import { useRtcStore } from "../state/store";
import { useIncomingInvite } from "./useIncomingInvite";
import { useTimeout } from "./useTimeout";

export function useRingTimeout() {
  const rtcStore = useRtcStore();
  const incomingInvite = useIncomingInvite();
  const session = useRtcStore((state) => state.session);

  const handleTimeout = () => {
    rtcStore.reset();
  };

  const timeoutMs =
    incomingInvite?.ringTimeoutMs ||
    (session?.ringTimeoutMs && session.status === "pending"
      ? session.ringTimeoutMs
      : null);

  const timeout = useTimeout(handleTimeout, timeoutMs);

  useEffect(() => {
    if (timeoutMs) {
      timeout.start();
    } else {
      timeout.stop();
    }
  }, [timeoutMs, timeout]);

  return {
    isActive: timeout.isActive(),
    stop: timeout.stop,
  };
}
