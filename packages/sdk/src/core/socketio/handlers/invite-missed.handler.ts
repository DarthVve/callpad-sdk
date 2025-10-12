import { pushStaleEventError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import type { CallInviteMissedEvent } from "../../../generated/socket";
import { callInviteMissedSchema } from "../../../generated/socket";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles invitation missed/timeout (call:inviteMissed)
 *
 * Updates outgoingInvites status when a participant doesn't respond
 * Only relevant for HOST/caller perspective
 */
export class InviteMissedHandler extends BaseSocketHandler<CallInviteMissedEvent> {
  protected readonly eventName = "call:inviteMissed";
  protected readonly schema = callInviteMissedSchema;

  protected handle(data: CallInviteMissedEvent): void {
    const currentState = rtcStore.getState();

    this.logger.info("Participant missed invitation", {
      callId: data.callId,
      participant: data.participant.userId,
    });

    // Verify this matches our current session
    if (currentState.session?.id !== data.callId) {
      pushStaleEventError("call:inviteMissed", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session?.id,
      });
      this.logger.warn("Ignoring missed invite for different call", { callId: data.callId });
      return;
    }

    this.updateStore((state) => {
      const userId = data.participant.userId;

      if (state.outgoingInvites[userId]) {
        state.outgoingInvites[userId].status = "missed";
      } else {
        state.outgoingInvites[userId] = {
          userId,
          status: "missed",
          participant: {
            userId: data.participant.userId,
            firstName: data.participant.firstName,
            lastName: data.participant.lastName,
            username: data.participant.username,
            email: data.participant.email,
            profilePhoto: data.participant.profilePhoto,
          },
        };
      }
    });

    this.logger.debug("Outgoing invite marked as missed", {
      userId: data.participant.userId,
    });
  }
}
