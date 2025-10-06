import { BaseSocketHandler } from "./base.handler";
import { callIncomingSchema } from "./schema";
import type { CallIncomingEvent } from "./schema";

export class CallIncomingHandler extends BaseSocketHandler<CallIncomingEvent> {
  protected readonly eventName = "call.incoming";
  protected readonly schema = callIncomingSchema;

  protected handle(data: CallIncomingEvent): void {
    // Find caller from participants array
    const caller = data.participants.find(
      (p) => p.role === "CALLER" || p.role === "HOST"
    );

    if (!caller) {
      this.logger.error("No caller found in participants", data);
      return;
    }

    this.updateStore((state) => {
      state.incomingCall = {
        callId: data.callId,
        caller: {
          id: caller.id,
          name:
            [caller.firstName, caller.lastName].filter(Boolean).join(" ") ||
            caller.username ||
            `Guest ${caller.id}`,
          avatarUrl: caller.profilePhoto,
        },
        type: data.type,
        timestamp: data.timestamp,
      };

      state.session = {
        id: data.callId,
        status: "RINGING",
        mode: data.type,
        // Identity context: incoming call, I haven't accepted yet
        initiatedByMe: false,
      };

      // Create unified participants from participants array
      for (const participant of data.participants) {
        const callState = participant.role === "CALLER" || participant.role === "HOST" ? "JOINED" : "INVITED";
        
        state.room.participants[participant.id] = {
          id: participant.id,
          firstName: participant.firstName || undefined,
          lastName: participant.lastName || undefined,
          avatarUrl: participant.profilePhoto || undefined,
          role: participant.role || "MEMBER",
          callState,
          audioEnabled: false,
          videoEnabled: false,
          isSpeaking: false,
          joinedAt:
            participant.role === "CALLER" || participant.role === "HOST"
              ? data.timestamp
              : undefined,
        };
        
        this.logger.debug("Created participant during incoming call", {
          participantId: participant.id,
          role: participant.role || "MEMBER",
          callState,
          callId: data.callId,
        });
      }
    });
  }
}
