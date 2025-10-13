import { SdkEventType, eventBus } from "../../events";
import { pushStaleEventError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import type { CallInviteSentEvent } from "../../../generated/socket";
import { callInviteSentSchema } from "../../../generated/socket";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles invitation sent confirmation (call:inviteSent)
 *
 * Tracks each sent invitation in outgoingInvites map
 * Only relevant for HOST/caller perspective
 */
export class InviteSentHandler extends BaseSocketHandler<CallInviteSentEvent> {
  protected readonly eventName = "call:inviteSent";
  protected readonly schema = callInviteSentSchema;

  protected handle(data: CallInviteSentEvent): void {
    const currentState = rtcStore.getState();
    this.logger.info("Invitation sent to participant", {
      callId: data.callId,
      invitee: data.invitee.userId,
    });

    // Verify this matches our current session
    if (currentState.session?.id !== data.callId) {
      pushStaleEventError("call:inviteSent", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session?.id,
      });
      this.logger.warn("Ignoring invite sent for different call", { callId: data.callId });
      return;
    }

    this.updateStore((state) => {
      const userId = data.invitee.userId;

      state.outgoingInvites[userId] = {
        userId,
        status: "sent",
        participant: {
          userId: data.invitee.userId,
          firstName: data.invitee.firstName,
          lastName: data.invitee.lastName,
          username: data.invitee.username,
          email: data.invitee.email,
          profilePhoto: data.invitee.profilePhoto,
        },
      };
    });

    // Emit SDK event
    eventBus.emit(SdkEventType.PARTICIPANT_INVITED, {
      callId: data.callId,
      participant: {
        id: data.invitee.userId,
        firstName: data.invitee.firstName,
        lastName: data.invitee.lastName,
        avatarUrl: data.invitee.profilePhoto,
      },
      timestamp: Date.now(),
    });

    this.logger.debug("Outgoing invite tracked", {
      userId: data.invitee.userId,
    });
  }
}
