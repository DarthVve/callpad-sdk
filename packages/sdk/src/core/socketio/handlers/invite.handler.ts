import type { CallInviteEvent } from "../../../generated/socket";
import { callInviteSchema } from "../../../generated/socket";
import { profileCache } from "../../../state/profileCache";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles incoming call invitation (call:invite)
 *
 * Sets incomingInvite state to show incoming call UI
 * Marks caller profile as pending for hydration
 */
export class InviteHandler extends BaseSocketHandler<CallInviteEvent> {
  protected readonly eventName = "call:invite";
  protected readonly schema = callInviteSchema;

  protected async handle(data: CallInviteEvent): Promise<void> {
    this.logger.info("Incoming call invitation", {
      callId: data.callId,
      callerId: data.callerId,
      mode: data.mode,
    });

    const callerProfile = await profileCache
      .getState()
      .getOrFetch(data.callerId);

    this.updateStore((state) => {
      const ringTimeoutMs = (data as any).ringTimeoutMs || 30000;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ringTimeoutMs);

      state.incomingInvite = {
        callId: data.callId,
        inviteId: data.inviteId,
        caller: {
          userId: data.callerId,
          role: "HOST",
          firstName: callerProfile?.firstName ?? "",
          lastName: callerProfile?.lastName ?? "",
          username: callerProfile?.username ?? "",
          email: "",
          profilePhoto: callerProfile?.profilePhoto ?? "",
        },
        mode: data.mode,
        expiresAt: expiresAt.toISOString(),
        expiresInMs: ringTimeoutMs,
        ringTimeoutMs,
      };

      state.session = {
        id: data.callId,
        status: "pending",
        mode: data.mode,
        role: "PARTICIPANT",
        ringTimeoutMs,
      };
    });

    eventBus.emit(SdkEventType.CALL_INCOMING, {
      callId: data.callId,
      callerId: data.callerId,
      type: data.mode,
      timestamp: Date.now(),
    });

    this.logger.debug("Incoming invite state updated");
  }
}
