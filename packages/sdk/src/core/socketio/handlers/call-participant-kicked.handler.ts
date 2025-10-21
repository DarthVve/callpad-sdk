import type { CallParticipantKickedEvent } from "../../../generated/socket";
import { callParticipantKickedSchema } from "../../../generated/socket";
import { profileCache } from "../../../state/profileCache";
import { rtcStore } from "../../../state/store";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles participant kicked event (call:participantKicked)
 *
 * If the current user was kicked, disconnects and resets state
 */
export class CallParticipantKickedHandler extends BaseSocketHandler<CallParticipantKickedEvent> {
  protected readonly eventName = "call:participantKicked";
  protected readonly schema = callParticipantKickedSchema;

  protected handle(data: CallParticipantKickedEvent): void {
    this.logger.info("Participant kicked", {
      callId: data.callId,
      participantId: data.participantId,
      reason: data.reason,
    });

    this.logger.debug("Participant kicked from call", {
      participantId: data.participantId,
    });
  }
}
