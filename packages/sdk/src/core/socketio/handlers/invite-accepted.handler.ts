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
      userId: data.userId,
    });

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
      if (state.outgoingInvites[data.userId]) {
        state.outgoingInvites[data.userId].status = "accepted";
      } else {
        state.outgoingInvites[data.userId] = {
          userId: data.userId,
          status: "accepted",
        };
      }
    });

    this.logger.debug("Outgoing invite marked as accepted", {
      userId: data.userId,
    });
  }
}
