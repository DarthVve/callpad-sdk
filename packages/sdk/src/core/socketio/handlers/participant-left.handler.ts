import { pushStaleEventError } from "../../../state/errors";
import { BaseSocketHandler } from "./base.handler";
import { participantLeftSchema } from "./schema";
import type { ParticipantLeftEvent } from "./schema";

export class ParticipantLeftHandler extends BaseSocketHandler<ParticipantLeftEvent> {
  protected readonly eventName = "call.participant-left";
  protected readonly schema = participantLeftSchema;

  protected handle(data: ParticipantLeftEvent): void {
    this.updateStore((state) => {
      if (state.session.id !== data.callId) {
        pushStaleEventError("call.participant-left", "callId mismatch", {
          eventCallId: data.callId,
          sessionCallId: state.session.id,
        });
        return;
      }

      const participant = state.room.participants[data.participant.id];
      if (participant) {
        participant.callState = "LEFT";
        participant.leftAt = data.timestamp || Date.now();
      }
    });

    const isLocalParticipant =
      this.livekit?.room.localParticipant?.identity === data.participant.id;
    if (isLocalParticipant && this.livekit) {
      this.livekit.disconnect().catch((error: any) => {
        this.logger.error("Error disconnecting from LiveKit after self-leave", {
          error,
        });
      });
    }
  }
}
