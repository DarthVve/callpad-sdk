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
    getParticipantInfo,
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
      {entries.map(entry => {
        const participant = getParticipantInfo(entry.sender.id);
        
        return (
          <div key={entry.id} className={isOwnEntry(entry) ? "own" : "other"}>
            <img src={participant?.profilePhoto} />
            <span>{participant?.firstName || entry.sender.id}</span>
            <p>{entry.content}</p>
            
            {entry.status === "sending" && <span>Sending...</span>}
            {entry.editedAt && <small>Edited</small>}
            {entry.removedAt && <small>Removed</small>}
            
            {/* Reactions */}
            <div className="reactions">
              {Object.entries(entry.reactions).map(([emoji, participantIds]) => (
                <div key={emoji}>
                  <span>{emoji} {participantIds.size}</span>
                  <div className="reactors">
                    {Array.from(participantIds).map(id => {
                      const reactor = getParticipantInfo(id);
                      return (
                        <img 
                          key={id} 
                          src={reactor?.profilePhoto} 
                          title={reactor?.firstName || id}
                        />
                      );
                    })}
                  </div>
                  <button onClick={() => react(entry.id, emoji)}>+</button>
                </div>
              ))}
            </div>
            
            {isOwnEntry(entry) && (
              <>
                <button onClick={() => edit(entry.id, "new content")}>Edit</button>
                <button onClick={() => remove(entry.id)}>Remove</button>
              </>
            )}
          </div>
        );
      })}
      
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
- `getParticipantInfo: (id: string) => ParticipantMetadata | null` - Get cached participant info
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
    id: string;                       // Participant identity
  };
  createdAt: number;                  // Timestamp (ms)
  editedAt?: number;                  // Last edit timestamp
  removedAt?: number;                 // Removal timestamp
  version: number;                    // Edit version
  reactions: Record<emoji, Set<participantId>>;
  status: "sending" | "sent" | "failed";
}
```

**Note:** Sender metadata is not stored in entries to save memory. Use `getParticipantInfo(entry.sender.id)` to retrieve participant details from the cache.

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
const { entries, getParticipantInfo, react, unreact } = useChat();

// Add reaction
await react(entry.id, "👍");

// Remove reaction
await unreact(entry.id, "👍");

// Toggle reaction
const localId = room.localParticipant.identity;
const hasReacted = entry.reactions["👍"]?.has(localId);
hasReacted ? await unreact(entry.id, "👍") : await react(entry.id, "👍");

// Display who reacted
{Object.entries(entry.reactions).map(([emoji, participantIds]) => (
  <div key={emoji}>
    <span>{emoji} {participantIds.size}</span>
    {Array.from(participantIds).map(id => {
      const reactor = getParticipantInfo(id);
      return <span key={id}>{reactor?.firstName || id}</span>;
    })}
  </div>
))}
```

### Message Status

Track send status:

```tsx
{entry.status === "sending" && <Spinner />}
{entry.status === "failed" && <ErrorIcon />}
{entry.status === "sent" && <CheckMark />}
```

## Participant Cache

The chat system maintains a cache of participant metadata to avoid duplicating data across messages. 

**How it works:**
- When sending or receiving messages, participant metadata is extracted and cached
- ChatEntry only stores the participant ID, not the full metadata
- Use `getParticipantInfo(id)` to retrieve cached metadata
- Cache persists during the session, even if participants leave
- Cache is cleared when room disconnects

**Benefits:**
- ~90% memory reduction for active chats
- Participant info updates propagate to all their messages
- Works for participants who have left the call

## Architecture

**Transport:** LiveKit text streams on topic `chat:v1`  
**State:** Zustand store with normalized structure + participant cache  
**Lifecycle:** Managed by DataChannelProvider  
**Persistence:** None - messages and cache cleared on disconnect
