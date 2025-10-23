import { useCallback } from "react";
import { useLocalParticipant } from "../livekit";
import { useSdk } from "../provider/RtcProvider";
import { useRtcStore } from "../state/store";
import { createLogger } from "../utils";
import { useCallActions } from "./useCallActions";
import { useCallState } from "./useCallState";
import { useIncomingInvite } from "./useIncomingInvite";
import { useParticipantMetadata } from "./useParticipantMetadata";

export interface UseTerminateReturn {
  terminate: () => Promise<void>;
  role: "HOST" | "PARTICIPANT" | "GUEST" | null;
  sessionId: string | null;
  isInitiator: boolean;
}

const logger = createLogger("useTerminate");

export function useTerminate(): UseTerminateReturn {
  const sdk = useSdk();
  const { id, status } = useCallState();
  const session = useRtcStore((state) => state.session);
  const isInitiator = useRtcStore((state) => state.initiated);
  const incomingInvite = useIncomingInvite();

  const sessionId = id;

  // Get the real-time role from LiveKit metadata (only available when connected)
  const participant = useLocalParticipant();
  const localParticipant = participant?.localParticipant;
  const participantMetadata = useParticipantMetadata(localParticipant);
  const role = participantMetadata?.role || null;

  const { cancel, decline, end, leave } = useCallActions();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const terminate = useCallback(async () => {
    if (!session || status === "ended") {
      return;
    }

    // Fire-and-forget pattern:
    // execute termination without waiting
    switch (status) {
      case "initializing":
        sdk.store.getState().reset();
        break;

      case "pending":
        if (isInitiator && sessionId) {
          console.log("Cancelling: ", sessionId, isInitiator);
          cancel().catch((error) => {
            logger.error("Failed to cancel call", { error, sessionId });
          });
          console.log("immediately..");
        } else if (incomingInvite) {
          decline().catch((error) => {
            logger.error("Failed to decline call", {
              error,
              inviteId: incomingInvite.inviteId,
            });
          });
        }
        break;

      case "ready":
      case "active":
        {
          leave().catch((error) => {
            logger.error("Failed to leave call", { error, sessionId, role });
          });

          if (role === "HOST" && sessionId) {
            end().catch((error) => {
              logger.error("Failed to end call", { error, sessionId, role });
            });
          }
        }
        break;

      default:
        logger.warn("Unknown call state during termination", { status });
        leave().catch((error) => {
          logger.error("Failed to leave call in unknown state", {
            error,
            status,
          });
        });
        break;
    }
  }, [session, status, role, sessionId, isInitiator, incomingInvite, sdk]);

  return {
    terminate,
    role,
    sessionId,
    isInitiator,
  };
}
