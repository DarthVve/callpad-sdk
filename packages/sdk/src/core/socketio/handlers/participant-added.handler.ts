import { SdkEventType, eventBus } from "../../events";
import { pushStaleEventError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import type { CallParticipantAddedEvent } from "../../../generated/socket";
import { callParticipantAddedSchema } from "../../../generated/socket";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles participant added to call (call:participantAdded)
 *
 * Updates room participants when someone joins
 * Note: This is supplementary - LiveKit also tracks participants
 */
export class ParticipantAddedHandler extends BaseSocketHandler<CallParticipantAddedEvent> {
  protected readonly eventName = "call:participantAdded";
  protected readonly schema = callParticipantAddedSchema;

  protected handle(data: CallParticipantAddedEvent): void {
    const currentState = rtcStore.getState();

    this.logger.info("Participant added to call", {
      callId: data.callId,
      participantId: data.participant.participantId,
      userId: data.participant.userId,
      role: data.participant.role,
    });

    // Verify this matches our current session
    if (currentState.session?.id !== data.callId) {
      pushStaleEventError("call:participantAdded", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session?.id,
      });
      this.logger.warn("Ignoring participant added for different call", { callId: data.callId });
      return;
    }

    // Sync session status from backend event
    this.updateStore((state) => {
      if (state.session && data.status) {
        state.session.status = data.status;
      }
    });

    // Emit SDK event
    eventBus.emit(SdkEventType.PARTICIPANT_UPDATED, {
      participantId: data.participant.participantId,
      timestamp: Date.now(),
    });

    this.logger.debug("Participant added event processed", {
      participantId: data.participant.participantId,
    });
  }
}
