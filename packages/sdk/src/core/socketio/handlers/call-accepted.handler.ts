import { pushStaleEventError, pushLiveKitConnectError } from "../../../state/errors";
import { rtcStore } from "../../../state/store";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";
import { callAcceptedSchema } from "./schema";
import type { CallAcceptedEvent } from "./schema";

export class CallParticipantAcceptedHandler extends BaseSocketHandler<CallAcceptedEvent> {
  protected readonly eventName = "call.participant-accepted";
  protected readonly schema = callAcceptedSchema;

  protected async handle(data: CallAcceptedEvent): Promise<void> {
    const currentState = rtcStore.getState();
    // Get current user ID from auth instead of localParticipantId
    const currentUserId = this.authManager?.getCurrentUserId();
    
    if (currentState.session.id !== data.callId) {
      pushStaleEventError("call.participant-accepted", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session.id,
      });
      return;
    }

    this.updateStore((state) => {
      // Simply set to ACCEPTED - let join-info handler manage the rest
      state.session.status = "ACCEPTED";
      
      const participant = state.room.participants[data.by.id];
      if (participant) {
        participant.callState = "RINGING"; // Accepted but not yet joined
        participant.joinedAt = data.by.acceptedAt || Date.now();
      }
    });

    // Join-info handler will handle auto-join when backend sends join-info
  }
}
