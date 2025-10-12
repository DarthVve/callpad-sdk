# Generated Socket.IO Types

This directory contains auto-generated TypeScript types and Zod schemas for Socket.IO events.

## Source

These types are generated from the backend JSON Schema available at:
```
http://localhost:3001/schema/socket.json
```

## Files

- **events.ts** - Zod schemas and TypeScript types for all socket event payloads
- **event-map.ts** - Type-safe event map for Socket.IO
- **index.ts** - Main export file

## Generation

To regenerate these types after backend schema changes:

```bash
pnpm generate:socket
```

Or regenerate all types (API + Socket):

```bash
pnpm generate
```

## Usage

### Using Generated Types

```typescript
import type { CallInviteEvent, SocketEventMap } from '@/generated/socket';

// Type-safe event handling
function handleInvite(data: CallInviteEvent) {
  console.log(data.callId, data.caller, data.mode);
}
```

### Using Generated Zod Schemas

```typescript
import { callInviteSchema } from '@/generated/socket';

// Runtime validation
const result = callInviteSchema.safeParse(rawData);
if (result.success) {
  // data is typed as CallInviteEvent
  console.log(result.data);
}
```

### Type-Safe Socket.IO

```typescript
import type { SocketEventMap } from '@/generated/socket';
import { Socket } from 'socket.io-client';

// For future: can be used to type Socket.IO client
type TypedSocket = Socket<SocketEventMap>;
```

## Available Events

The following events are currently available (from backend schema):

- `call:cancelled` - Call cancellation event
- `call:created` - New call created
- `call:ended` - Call ended
- `call:invite` - Incoming call invitation
- `call:inviteAccepted` - Invitation accepted
- `call:inviteCancelled` - Invitation cancelled
- `call:inviteDeclined` - Invitation declined
- `call:inviteMissed` - Invitation missed
- `call:inviteSent` - Invitation sent to participant
- `call:joinInfo` - LiveKit join information
- `call:missed` - Call missed
- `call:participantAdded` - New participant added

## Notes

⚠️ **DO NOT EDIT FILES IN THIS DIRECTORY MANUALLY**

These files are auto-generated and will be overwritten on the next generation run.

If you need to make changes:
1. Update the backend JSON schema
2. Run `pnpm generate:socket` to regenerate types

## Schema Structure

Each event in the backend schema has:
- **eventName** - The Socket.IO event name (e.g., `call:invite`)
- **payload** - JSON Schema defining the event data structure

The generator converts these to:
- **Zod Schema** - For runtime validation (e.g., `callInviteSchema`)
- **TypeScript Type** - For compile-time type checking (e.g., `CallInviteEvent`)
