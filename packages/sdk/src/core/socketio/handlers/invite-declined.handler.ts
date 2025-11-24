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
      userId: data.userId,
      reason: data.reason,
    });

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
      if (state.outgoingInvites[data.userId]) {
        state.outgoingInvites[data.userId].status = "declined";
      } else {
        state.outgoingInvites[data.userId] = {
          userId: data.userId,
          status: "declined",
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

    eventBus.emit(SdkEventType.CALL_DECLINED, {
      callId: data.callId,
      participantId: data.userId,
      reason: data.reason,
      timestamp: Date.now(),
    });

    if (data.reason) {
      this.logger.info("Decline reason provided", { reason: data.reason });
    }

    this.logger.debug("Outgoing invite marked as declined", {
      userId: data.userId,
    });
  }
}
