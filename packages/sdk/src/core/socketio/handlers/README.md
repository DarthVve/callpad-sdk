# Socket.IO Event Handlers

This directory contains handlers for Socket.IO events from the backend.

## Architecture

### BaseSocketHandler

All handlers extend `BaseSocketHandler<TPayload>` which provides:
- Automatic Zod schema validation
- Structured error logging
- Type-safe payload handling
- Store updates

### Creating a New Handler

You can use either manual schemas or generated schemas from `src/generated/socket`.

#### Option 1: Using Generated Types (Recommended for new handlers)

```typescript
import { BaseSocketHandler } from "./base.handler";
import { callInviteSchema, type CallInviteEvent } from "../../../generated/socket";

export class CallInviteHandler extends BaseSocketHandler<CallInviteEvent> {
  protected readonly eventName = "call:invite";
  protected readonly schema = callInviteSchema;

  protected handle(data: CallInviteEvent): void {
    // data is fully typed!
    console.log(data.callId, data.caller, data.mode);

    // Update store
    this.updateStore((state) => {
      state.session.id = data.callId;
      state.session.status = "RINGING";
    });

    // Emit SDK event
    eventBus.emit(SdkEventType.CALL_INVITE, data);
  }
}
```

#### Option 2: Using Manual Schemas (Legacy handlers)

```typescript
import { z } from "zod";
import { BaseSocketHandler } from "./base.handler";

const myEventSchema = z.object({
  callId: z.string(),
  // ... other fields
});

type MyEvent = z.infer<typeof myEventSchema>;

export class MyEventHandler extends BaseSocketHandler<MyEvent> {
  protected readonly eventName = "my.event";
  protected readonly schema = myEventSchema;

  protected handle(data: MyEvent): void {
    // handler logic
  }
}
```

### Registering Handlers

Add your handler to `handler.registry.ts`:

```typescript
import { MyEventHandler } from "./my-event.handler";

private initializeHandlers(): void {
  const handlers = [
    // ... existing handlers
    new MyEventHandler(this.options),
  ];

  for (const handler of handlers) {
    this.handlers.set((handler as any).eventName, handler);
  }
}
```

## Generated Types

Generated Socket.IO types are available in `src/generated/socket/`:
- Run `pnpm generate:socket` to regenerate from backend schema
- See `src/generated/socket/README.md` for more details

## Event Names

Current backend events (from `http://localhost:3001/schema/socket.json`):
- `call:cancelled`
- `call:created`
- `call:ended`
- `call:invite`
- `call:inviteAccepted`
- `call:inviteCancelled`
- `call:inviteDeclined`
- `call:inviteMissed`
- `call:inviteSent`
- `call:joinInfo`
- `call:missed`
- `call:participantAdded`

Legacy events (manual schemas - may need migration):
- `call.incoming`
- `call.participant-accepted`
- `call.participant-declined`
- `call.ended`
- `call.join-info`
- `call.timeout`
- `call.canceled`
