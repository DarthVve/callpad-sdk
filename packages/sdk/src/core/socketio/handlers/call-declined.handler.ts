import { z } from "zod";
import { BaseSocketHandler } from "./base.handler";

const callDeclinedSchema = z.object({
  callId: z.string(),
  by: z.object({
    id: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    username: z.string().nullable(),
    profilePhoto: z.string().nullable(),
  }),
  reason: z.string().optional(),
});

type CallDeclinedEvent = z.infer<typeof callDeclinedSchema>;

export class CallDeclinedHandler extends BaseSocketHandler<CallDeclinedEvent> {
  protected readonly eventName = "call.declined";
  protected readonly schema = callDeclinedSchema;

  protected handle(data: CallDeclinedEvent): void {
    this.updateStore((state) => {
      if (state.session.id === data.callId) {
        state.session.status = "IDLE";
        state.incomingCall = undefined;
      }
    });
  }
}
