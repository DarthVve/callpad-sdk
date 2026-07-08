import type { CallInviteMissedEvent } from "../../../generated/socket";
import { callInviteMissedSchema } from "../../../generated/socket";
import { pushStaleEventError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles invitation missed/timeout (call:inviteMissed)
 *
 * Updates outgoingInvites status when an invite times out
 * Only relevant for HOST/caller perspective
 */
export class InviteMissedHandler extends BaseSocketHandler<CallInviteMissedEvent> {
  protected readonly eventName = "call:inviteMissed";
  protected readonly schema = callInviteMissedSchema;

  protected handle(data: CallInviteMissedEvent): void {
    const currentState = rtcStore.getState();

    this.logger.info("Participant missed invitation (timeout)", {
      callId: data.callId,
      userId: data.userId,
    });

    if (currentState.session?.id !== data.callId) {
      pushStaleEventError("call:inviteMissed", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session?.id,
      });
      this.logger.warn("Ignoring missed event for different call", {
        callId: data.callId,
      });
      return;
    }

    this.updateStore((state) => {
      if (state.outgoingInvites[data.userId]) {
        state.outgoingInvites[data.userId].status = "missed";
      } else {
        state.outgoingInvites[data.userId] = {
          userId: data.userId,
          status: "missed",
        };
      }

      const inviteStatuses = Object.values(state.outgoingInvites).map(
        (inv: any) => inv.status
      );
      const allDeclinedOrMissed = inviteStatuses.every(
        (status: string) => status === "declined" || status === "missed"
      );

      if (
        inviteStatuses.length > 0 &&
        allDeclinedOrMissed &&
        state.session?.status === "pending"
      ) {
        state.session = null;
        state.outgoingInvites = {};
        state.initiated = false;
      }
    });

    eventBus.emit(SdkEventType.CALL_MISSED, {
      callId: data.callId,
      participantId: data.userId,
      timestamp: Date.now(),
    });

    this.logger.debug("Outgoing invite marked as missed", {
      userId: data.userId,
    });
  }
}
