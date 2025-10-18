import type { CallInviteAcceptedEvent } from "../../../generated/socket";
import { callInviteAcceptedSchema } from "../../../generated/socket";
import { pushStaleEventError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles invitation accepted (call:inviteAccepted)
 *
 * Updates outgoingInvites status when a participant accepts
 * Only relevant for HOST/caller perspective
 */
export class InviteAcceptedHandler extends BaseSocketHandler<CallInviteAcceptedEvent> {
  protected readonly eventName = "call:inviteAccepted";
  protected readonly schema = callInviteAcceptedSchema;

  protected handle(data: CallInviteAcceptedEvent): void {
    const currentState = rtcStore.getState();

    this.logger.info("Participant accepted invitation", {
      callId: data.callId,
      participant: data.participant.userId,
    });

    // Verify this matches our current session
    if (currentState.session?.id !== data.callId) {
      pushStaleEventError("call:inviteAccepted", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session?.id,
      });
      this.logger.warn("Ignoring accept event for different call", {
        callId: data.callId,
      });
      return;
    }

    this.updateStore((state) => {
      // Sync session status from a backend event
      if (state.session !== data.status) {
          console.log("Setting session", state.session);
        state.session.status = data.status;
      }
      console.log("state.session.status", state.session.status, data.status);

      const userId = data.participant.userId;

      if (state.outgoingInvites[userId]) {
        state.outgoingInvites[userId].status = "accepted";
      } else {
        state.outgoingInvites[userId] = {
          userId,
          status: "accepted",
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

    this.logger.debug("Outgoing invite marked as accepted", {
      userId: data.participant.userId,
    });
  }
}
