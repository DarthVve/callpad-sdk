import type { CallInviteDeclinedEvent } from "../../../generated/socket";
import { callInviteDeclinedSchema } from "../../../generated/socket";
import { pushStaleEventError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles invitation declined (call:inviteDeclined)
 *
 * Updates outgoingInvites status when a participant declines
 * Only relevant for HOST/caller perspective
 */
export class InviteDeclinedHandler extends BaseSocketHandler<CallInviteDeclinedEvent> {
  protected readonly eventName = "call:inviteDeclined";
  protected readonly schema = callInviteDeclinedSchema;

  protected handle(data: CallInviteDeclinedEvent): void {
    const currentState = rtcStore.getState();

    this.logger.info("Participant declined invitation", {
      callId: data.callId,
      participant: data.participant.userId,
      reason: data.reason,
    });

    // Verify this matches our current session
    if (currentState.session?.id !== data.callId) {
      pushStaleEventError("call:inviteDeclined", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session?.id,
      });
      this.logger.warn("Ignoring decline event for different call", {
        callId: data.callId,
      });
      return;
    }

    this.updateStore((state) => {
      const userId = data.participant.userId;

      if (state.outgoingInvites[userId]) {
        state.outgoingInvites[userId].status = "declined";
      } else {
        state.outgoingInvites[userId] = {
          userId,
          status: "declined",
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

    // Emit SDK event
    eventBus.emit(SdkEventType.CALL_DECLINED, {
      callId: data.callId,
      participantId: data.participant.userId,
      reason: data.reason,
      timestamp: Date.now(),
    });

    this.logger.debug("Outgoing invite marked as declined", {
      userId: data.participant.userId,
    });
  }
}
