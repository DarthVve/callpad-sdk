import type { CallInviteEvent } from "../../../generated/socket";
import { callInviteSchema } from "../../../generated/socket";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles incoming call invitation (call:invite)
 *
 * Sets incomingInvite state to show incoming call UI
 */
export class InviteHandler extends BaseSocketHandler<CallInviteEvent> {
  protected readonly eventName = "call:invite";
  protected readonly schema = callInviteSchema;

  protected handle(data: CallInviteEvent): void {
    this.logger.info("Incoming call invitation", {
      callId: data.callId,
      caller: data.caller.userId,
      mode: data.mode,
    });

    this.updateStore((state) => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30000); // 30 seconds from now

      state.incomingInvite = {
        callId: data.callId,
        inviteId: data.inviteId,
        caller: {
          userId: data.caller.userId,
          role: "HOST",
          firstName: data.caller.firstName ?? "",
          lastName: data.caller.lastName ?? "",
          username: data.caller.username ?? "",
          email: data.caller.email ?? "",
          profilePhoto: data.caller.profilePhoto ?? "",
        },
        mode: data.mode,
        expiresAt: expiresAt.toISOString(),
        expiresInMs: 30000,
      };

      state.session = {
        id: data.callId,
        status: "pending",
        mode: data.mode,
        role: "PARTICIPANT",
      };
    });

    // Emit SDK event for the application layer
    eventBus.emit(SdkEventType.CALL_INCOMING, {
      callId: data.callId,
      caller: {
        id: data.caller.userId,
        firstName: data.caller.firstName,
        lastName: data.caller.lastName,
        avatarUrl: data.caller.profilePhoto,
      },
      type: data.mode,
      timestamp: Date.now(),
    });

    this.logger.debug("Incoming invite state updated");
  }
}
