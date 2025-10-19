# Chat System Documentation

Real-time chat system using LiveKit data channels with support for messages, edits, removes, and reactions.

## Setup

Wrap your app with `DataChannelProvider`:

```tsx
import { useAutoConnectRoom, RtcProvider } from "vg-x07df";
import { DataChannelProvider } from "vg-x07df/channel";

function App() {
  const room = useAutoConnectRoom();
  
  return (
    <RtcProvider options={...}>
      <DataChannelProvider room={room}>
        <ChatBox />
      </DataChannelProvider>
    </RtcProvider>
  );
}
```

## Basic Usage

Use the `useChat` hook:

```tsx
import { useChat } from "vg-x07df/channel";

function ChatBox() {
  const { 
    entries, 
    isReady,
    isOwnEntry,
    send, 
    edit, 
    remove, 
    react, 
    unreact 
  } = useChat();
  
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    await send(message);
    setMessage("");
  };

  return (
    <div>
      {entries.map(entry => (
        <div key={entry.id} className={isOwnEntry(entry) ? "own" : "other"}>
          <img src={entry.sender.info?.profilePhoto} />
          <span>{entry.sender.info?.firstName}</span>
          <p>{entry.content}</p>
          
          {entry.status === "sending" && <span>Sending...</span>}
          {entry.editedAt && <small>Edited</small>}
          {entry.removedAt && <small>Removed</small>}
          
          {isOwnEntry(entry) && (
            <>
              <button onClick={() => edit(entry.id, "new content")}>Edit</button>
              <button onClick={() => remove(entry.id)}>Remove</button>
            </>
          )}
        </div>
      ))}
      
      <input value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

## API Reference

### `useChat()`

Returns:
- `entries: ChatEntry[]` - Sorted array of all chat entries
- `isReady: boolean` - Always true (throws if chat not enabled)
- `isOwnEntry: (entry) => boolean` - Check if entry is from local participant
- `send: (content: string) => Promise<void>` - Send new message
- `edit: (id: string, content: string) => Promise<void>` - Edit existing message
- `remove: (id: string) => Promise<void>` - Remove message
- `react: (id: string, emoji: string) => Promise<void>` - Add emoji reaction
- `unreact: (id: string, emoji: string) => Promise<void>` - Remove emoji reaction

### `ChatEntry`

```typescript
{
  id: string;
  content: string;
  sender: {
    sid: string;                      // Session ID
    identity: string;                 // Participant identity
    info?: {                          // Full participant metadata
      userId: string | number;
      firstName: string | null;
      lastName: string | null;
      username: string | null;
      email: string | null;
      profilePhoto: string | null;
      role: "HOST" | "PARTICIPANT" | "GUEST";
      permissions: { ... }
    }
  };
  createdAt: number;                  // Timestamp (ms)
  editedAt?: number;                  // Last edit timestamp
  removedAt?: number;                 // Removal timestamp
  version: number;                    // Edit version
  reactions: Record<emoji, Set<participantSid>>;
  status: "sending" | "sent" | "failed";
}
```

## Features

### Editing Messages

Only the sender can edit their own messages:

```tsx
await edit(entry.id, "Updated content");
```

### Removing Messages

Only the sender can remove their own messages:

```tsx
await remove(entry.id);
```

Removed messages have `removedAt` set but remain in the list. UI can choose to hide or show "removed" placeholder.

### Reactions

Any participant can react to any message:

```tsx
// Add reaction
await react(entry.id, "👍");

// Remove reaction
await unreact(entry.id, "👍");

// Toggle reaction
const hasReacted = entry.reactions["👍"]?.has(localParticipantSid);
hasReacted ? await unreact(entry.id, "👍") : await react(entry.id, "👍");
```

### Message Status

Track send status:

```tsx
{entry.status === "sending" && <Spinner />}
{entry.status === "failed" && <ErrorIcon />}
{entry.status === "sent" && <CheckMark />}
```

## Architecture

**Transport:** LiveKit text streams on topic `chat:v1`  
**State:** Zustand store with normalized structure  
**Lifecycle:** Managed by DataChannelProvider  
**Persistence:** None - messages cleared on disconnect
