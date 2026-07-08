import type { CallParticipantAddedEvent } from "../../../generated/socket";
import { callParticipantAddedSchema } from "../../../generated/socket";
import { pushStaleEventError } from "../../../state/errors";
import { profileCache } from "../../../state/profileCache";
import { rtcStore } from "../../../state/store";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles participant added to call (call:participantAdded)
 *
 * Updates outgoingInvites if we invited this user
 * Marks profile as pending for hydration
 */
export class ParticipantAddedHandler extends BaseSocketHandler<CallParticipantAddedEvent> {
  protected readonly eventName = "call:participantAdded";
  protected readonly schema = callParticipantAddedSchema;

  protected async handle(data: CallParticipantAddedEvent): Promise<void> {
    const currentState = rtcStore.getState();

    this.logger.info("Participant added to call", {
      callId: data.callId,
      participantId: data.participantId,
      userId: data.userId,
    });

    if (currentState.session?.id !== data.callId) {
      pushStaleEventError("call:participantAdded", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session?.id,
      });
      this.logger.warn("Ignoring participant added for different call", {
        callId: data.callId,
      });
      return;
    }

    await profileCache.getState().getOrFetch(data.userId);

    this.updateStore((state) => {
      if (state.outgoingInvites[data.userId]) {
        state.outgoingInvites[data.userId].status = "accepted";
      }
    });

    eventBus.emit(SdkEventType.PARTICIPANT_UPDATED, {
      participantId: data.participantId,
      timestamp: Date.now(),
    });

    this.logger.debug("Participant added event processed", {
      participantId: data.participantId,
      userId: data.userId,
    });
  }
}
