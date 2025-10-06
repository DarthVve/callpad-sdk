import { pushStaleEventError, pushLiveKitConnectError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";
import { callParticipantAcceptedSchema } from "./schema";
import type { CallParticipantAcceptedEvent } from "./schema";

export class CallParticipantAcceptedHandler extends BaseSocketHandler<CallParticipantAcceptedEvent> {
  protected readonly eventName = "call.participant-accepted";
  protected readonly schema = callParticipantAcceptedSchema;

  protected async handle(data: CallParticipantAcceptedEvent): Promise<void> {
    const currentState = rtcStore.getState();
    const currentUserId = this.authManager?.getCurrentUserId();
    
    if (currentState.session.id !== data.callId) {
      pushStaleEventError("call.participant-accepted", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session.id,
      });
      return;
    }

    this.updateStore((state) => {
      state.session.status = "ACCEPTED";
      
      const participant = state.room.participants[data.participantId];
      if (participant) {
        participant.callState = "RINGING";
        participant.joinedAt = data.acceptedAt ? new Date(data.acceptedAt).getTime() : Date.now();
      }
    });
  }
}
