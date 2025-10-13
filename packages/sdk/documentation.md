# CallPad Web SDK Documentation

## Overview

The CallPad Web SDK provides a complete real-time calling solution for web applications. It handles call signaling, state management, and LiveKit media streaming through a simple React-based API.

### Key Features

- **Backend-driven state management**: All state changes triggered by server events
- **Real-time signaling**: Socket.IO integration for instant call updates
- **LiveKit integration**: High-quality audio/video streaming
- **Type-safe API**: Full TypeScript support
- **React hooks**: Simple, idiomatic React integration
- **Flexible architecture**: Support for both inbound and outbound call flows

### Architecture

```
┌─────────────────┐
│  React App      │
│  (Your Code)    │
└────────┬────────┘
         │
         │ Hooks API
         ▼
┌─────────────────┐
│  CallPad SDK    │
│  - State (Zustand)
│  - Socket.IO    │
│  - REST API     │
└────────┬────────┘
         │
         ├──────────► Signal Service (Backend)
         │             - Call signaling
         │             - Invite management
         │
         └──────────► LiveKit (Media)
                       - Audio/Video streaming
                       - Participant management
```

---

## Installation

```bash
npm install @voyatek/callpad-sdk
# or
pnpm add @voyatek/callpad-sdk
# or
yarn add @voyatek/callpad-sdk
```

---

## Setup

### 1. Wrap Your App with RtcProvider

```tsx
import { RtcProvider } from "@voyatek/callpad-sdk";

function App() {
  return (
    <RtcProvider
      options={{
        appId: "your-app-id",
        signalHost: "https://signal.yourapp.com",
        authProvider: () => getYourJWTToken(),
        logLevel: "info",
        enableDebug: true,
      }}
    >
      <YourApp />
    </RtcProvider>
  );
}
```

### 2. Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `appId` | `string` | Yes | Your application identifier |
| `signalHost` | `string` | Yes | Signal service base URL |
| `authProvider` | `() => string \| null` | Yes | Function that returns JWT token |
| `logLevel` | `"debug" \| "info" \| "warn" \| "error"` | No | Logging verbosity (default: `"info"`) |
| `enableDebug` | `boolean` | No | Enable debug logging (default: `false`) |
| `log` | `(level, message, meta?) => void` | No | Custom log handler |

---

## Core Concepts

### Backend-Driven State

The SDK follows a **backend-driven architecture**:
- All state changes are triggered by Socket.IO events from the backend
- API calls (like `initiate()`, `accept()`) do NOT update state directly
- State updates happen when the server confirms actions via socket events

### Session Lifecycle

A call session has three states:

```
┌──────────┐   accept()   ┌──────────┐   end()    ┌──────────┐
│ pending  │ ──────────► │  active  │ ──────────►│  ended   │
└──────────┘              └──────────┘            └──────────┘
     │                                                  ▲
     │ decline() / cancel()                             │
     └──────────────────────────────────────────────────┘
```

- **pending**: Call created, invitations sent, awaiting acceptance
- **active**: At least one participant connected to LiveKit room
- **ended**: Call terminated

### Inbound vs Outbound Flows

**Outbound (Caller perspective)**:
- You initiate the call → `initiated: true`
- Track invitation responses via `outgoingInvites`
- You are the HOST

**Inbound (Callee perspective)**:
- You receive an invite → `incomingInvite` populated
- You accept/decline → Session created on accept
- You are a PARTICIPANT

---

## Available Hooks

### `useCallState()`

Get the current call session state.

```tsx
import { useCallState } from "@voyatek/callpad-sdk";

function CallStatus() {
  const callState = useCallState();

  if (!callState.id) {
    return <div>No active call</div>;
  }

  return (
    <div>
      <p>Call ID: {callState.id}</p>
      <p>Status: {callState.status}</p>
      <p>Mode: {callState.mode}</p>
      <p>Room: {callState.roomName}</p>
    </div>
  );
}
```

**Returns**: `CallState`
```typescript
interface CallState {
  id: string | null;
  status: "pending" | "active" | "ended" | null;
  mode: "AUDIO" | "VIDEO" | null;
  roomName: string | null;
}
```

---

### `useIncomingInvite()`

Detect incoming call invitations.

```tsx
import { useIncomingInvite, useCallActions } from "@voyatek/callpad-sdk";

function IncomingCallDialog() {
  const invite = useIncomingInvite();
  const { accept, decline } = useCallActions();

  if (!invite) {
    return null;
  }

  return (
    <div className="incoming-call">
      <p>{invite.caller.firstName} is calling...</p>
      <p>Mode: {invite.mode}</p>
      <button onClick={() => accept(invite.callId)}>Accept</button>
      <button onClick={() => decline(invite.callId)}>Decline</button>
    </div>
  );
}
```

**Returns**: `IncomingInvite | null`
```typescript
interface IncomingInvite {
  callId: string;
  caller: {
    userId: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    email?: string | null;
    profilePhoto?: string | null;
  };
  mode: "AUDIO" | "VIDEO";
  expiresAt: string;
  expiresInMs: number;
}
```

---

### `useOutgoingInvites()`

Track invitations you've sent (caller perspective).

```tsx
import { useOutgoingInvites } from "@voyatek/callpad-sdk";

function OutgoingInviteList() {
  const invites = useOutgoingInvites();

  return (
    <div>
      <h3>Invitations Sent</h3>
      {Object.values(invites).map((invite) => (
        <div key={invite.userId}>
          <p>{invite.participant.firstName}</p>
          <span className={`status-${invite.status}`}>
            {invite.status}
          </span>
        </div>
      ))}
    </div>
  );
}
```

**Returns**: `Record<string, OutgoingInvite>`
```typescript
interface OutgoingInvite {
  userId: string;
  status: "sent" | "accepted" | "declined" | "missed";
  participant: ParticipantInfo;
}
```

---

### `useCallInitiated()`

Check if the current call was initiated by you.

```tsx
import { useCallInitiated } from "@voyatek/callpad-sdk";

function CallControls() {
  const initiated = useCallInitiated();

  return (
    <div>
      {initiated ? (
        <button>End Call (Host)</button>
      ) : (
        <button>Leave Call</button>
      )}
    </div>
  );
}
```

**Returns**: `boolean`

---

### `useCallActions()`

Access all call control methods.

```tsx
import { useCallActions } from "@voyatek/callpad-sdk";

function CallControls() {
  const actions = useCallActions();

  const startCall = async () => {
    const response = await actions.initiate(
      ["user-id-1", "user-id-2"],
      "VIDEO"
    );
    console.log("Call started:", response.callId);
  };

  return <button onClick={startCall}>Start Video Call</button>;
}
```

**Available Methods**:

| Method | Signature | Description |
|--------|-----------|-------------|
| `initiate` | `(participants: string[], type: "AUDIO" \| "VIDEO") => Promise<CallResponse>` | Start a new call |
| `accept` | `(callId: string) => Promise<CallResponse>` | Accept an invitation |
| `decline` | `(callId: string, reason?: string) => Promise<CallResponse>` | Decline an invitation |
| `cancel` | `(callId: string) => Promise<CallResponse>` | Cancel pending invitations |
| `leave` | `(callId: string) => Promise<CallResponse>` | Leave an active call |
| `end` | `(callId: string) => Promise<CallResponse>` | End call (host only) |
| `transfer` | `(callId: string, targetParticipantId: string, reason?: string) => Promise<CallResponse>` | Transfer call |
| `kick` | `(callId: string, participantId: string, reason?: string) => Promise<CallResponse>` | Remove participant (host only) |
| `mute` | `(callId: string, participantId: string) => Promise<CallResponse>` | Mute participant (host only) |

---

### `useParticipantInfo()`

Get typed participant information from LiveKit participant metadata.

```tsx
import { useParticipantInfo, useParticipants } from "@voyatek/callpad-sdk";

function ParticipantCard({ participantIdentity }: { participantIdentity: string }) {
  const participantInfo = useParticipantInfo(participantIdentity);

  if (!participantInfo) {
    return <div>Loading participant info...</div>;
  }

  return (
    <div className="participant-card">
      <img src={participantInfo.profilePhoto} alt={participantInfo.firstName} />
      <h3>{participantInfo.firstName} {participantInfo.lastName}</h3>
      <p>@{participantInfo.username}</p>
      <span className="role">{participantInfo.role}</span>
    </div>
  );
}

// Or get current participant from context
function CurrentUserInfo() {
  const myInfo = useParticipantInfo();

  return (
    <div>
      <p>You are: {myInfo?.firstName}</p>
      <p>Role: {myInfo?.role}</p>
    </div>
  );
}

// Or use with participant object
function ParticipantList() {
  const participants = useParticipants();

  return (
    <div>
      {participants.map((participant) => {
        const info = useParticipantInfo(participant);
        return (
          <div key={participant.identity}>
            {info?.firstName || participant.identity}
          </div>
        );
      })}
    </div>
  );
}
```

**Parameters**:
- `participantOrIdentity` (optional): `string | Participant`
  - If string: participant identity to look up
  - If Participant: LiveKit participant object
  - If undefined: uses current participant from context

**Returns**: `ParticipantInfo | null`
```typescript
interface ParticipantInfo {
  userId: string;
  role: "HOST" | "PARTICIPANT" | "GUEST";
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  profilePhoto: string;
}
```

**Note**: This hook parses the JSON metadata stored in the LiveKit participant's metadata field. The backend must store participant information in this format when generating LiveKit tokens.

---

### `useRoom()`

Access the LiveKit Room instance for media management.

```tsx
import { useRoom } from "@voyatek/callpad-sdk";
import { useParticipants, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";

function VideoCall() {
  const room = useRoom();

  // Use LiveKit's hooks (they work with our room)
  const participants = useParticipants({ room });
  const tracks = useTracks([Track.Source.Camera], { room });

  if (!room) {
    return <div>Connecting...</div>;
  }

  return (
    <div className="video-grid">
      {tracks.map((track) => (
        <VideoTrack key={track.participant.identity} {...track} />
      ))}
    </div>
  );
}
```

**Returns**: `Room | null`

**With Custom Options**:
```tsx
import { useRoom } from "@voyatek/callpad-sdk";
import type { RoomOptions } from "livekit-client";

const customOptions: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  videoCaptureDefaults: {
    resolution: {
      width: 1280,
      height: 720,
    },
  },
};

function VideoCall() {
  const room = useRoom(customOptions);
  // ...
}
```

---

## Call Flows

### Flow 1: Initiating a Call (Outbound)

```tsx
import {
  useCallActions,
  useCallState,
  useOutgoingInvites,
  useRoom,
} from "@voyatek/callpad-sdk";

function CallInitiator() {
  const { initiate } = useCallActions();
  const callState = useCallState();
  const invites = useOutgoingInvites();
  const room = useRoom();

  const startCall = async () => {
    try {
      const response = await initiate(
        ["user-123", "user-456"],
        "VIDEO"
      );

      console.log("Call initiated:", response.callId);
      // State will update via socket events:
      // 1. call:created → session created, initiated: true
      // 2. call:inviteSent → outgoingInvites populated
      // 3. call:inviteAccepted → invite status updated
      // 4. call:joinInfo → livekitInfo set, room connects

    } catch (error) {
      console.error("Failed to initiate call:", error);
    }
  };

  if (!callState.id) {
    return <button onClick={startCall}>Start Call</button>;
  }

  if (callState.status === "pending") {
    return (
      <div>
        <p>Waiting for participants...</p>
        {Object.values(invites).map((invite) => (
          <div key={invite.userId}>
            {invite.participant.firstName}: {invite.status}
          </div>
        ))}
      </div>
    );
  }

  if (callState.status === "active" && room) {
    return <VideoCallUI room={room} />;
  }

  return null;
}
```

---

### Flow 2: Receiving a Call (Inbound)

```tsx
import {
  useIncomingInvite,
  useCallActions,
  useCallState,
  useRoom,
} from "@voyatek/callpad-sdk";

function IncomingCallHandler() {
  const invite = useIncomingInvite();
  const { accept, decline } = useCallActions();
  const callState = useCallState();
  const room = useRoom();

  const handleAccept = async () => {
    if (!invite) return;

    try {
      await accept(invite.callId);
      // State will update via socket events:
      // 1. call:inviteAccepted → sent to caller
      // 2. call:joinInfo → livekitInfo set, room connects
      // 3. call:participantAdded → broadcast to room

    } catch (error) {
      console.error("Failed to accept call:", error);
    }
  };

  const handleDecline = async () => {
    if (!invite) return;

    try {
      await decline(invite.callId, "User declined");
      // State cleared via socket events:
      // 1. call:inviteDeclined → sent to caller
      // 2. incomingInvite → cleared

    } catch (error) {
      console.error("Failed to decline call:", error);
    }
  };

  // Show incoming call dialog
  if (invite && !callState.id) {
    return (
      <div className="incoming-call-dialog">
        <h2>{invite.caller.firstName} is calling</h2>
        <p>Mode: {invite.mode}</p>
        <button onClick={handleAccept}>Accept</button>
        <button onClick={handleDecline}>Decline</button>
      </div>
    );
  }

  // Call accepted, waiting for connection
  if (callState.status === "pending") {
    return <div>Connecting...</div>;
  }

  // Call active, show video UI
  if (callState.status === "active" && room) {
    return <VideoCallUI room={room} />;
  }

  return null;
}
```

---

### Flow 3: During a Call (Media Management)

```tsx
import { useRoom } from "@voyatek/callpad-sdk";
import {
  useParticipants,
  useTracks,
  VideoTrack,
  AudioTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useState } from "react";

function VideoCallUI() {
  const room = useRoom();
  const participants = useParticipants({ room });
  const videoTracks = useTracks([Track.Source.Camera], { room });
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  if (!room) {
    return <div>No active room</div>;
  }

  const toggleMute = async () => {
    await room.localParticipant.setMicrophoneEnabled(isMuted);
    setIsMuted(!isMuted);
  };

  const toggleCamera = async () => {
    await room.localParticipant.setCameraEnabled(isCameraOff);
    setIsCameraOff(!isCameraOff);
  };

  const shareScreen = async () => {
    await room.localParticipant.setScreenShareEnabled(true);
  };

  return (
    <div className="video-call">
      <div className="video-grid">
        {videoTracks.map((track) => (
          <div key={track.participant.identity} className="participant">
            <VideoTrack {...track} />
            <p>{track.participant.identity}</p>
          </div>
        ))}
      </div>

      <div className="controls">
        <button onClick={toggleMute}>
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button onClick={toggleCamera}>
          {isCameraOff ? "Camera On" : "Camera Off"}
        </button>
        <button onClick={shareScreen}>Share Screen</button>
      </div>

      <div className="participant-list">
        <h3>Participants ({participants.length})</h3>
        {participants.map((p) => (
          <div key={p.identity}>
            {p.identity} - {p.isSpeaking ? "🎤 Speaking" : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### Flow 4: Ending a Call

```tsx
import {
  useCallActions,
  useCallState,
  useCallInitiated,
  useRoom,
} from "@voyatek/callpad-sdk";

function EndCallButton() {
  const { end, leave } = useCallActions();
  const callState = useCallState();
  const initiated = useCallInitiated();
  const room = useRoom();

  const handleEndCall = async () => {
    if (!callState.id) return;

    try {
      if (initiated) {
        // Host ends call for everyone
        await end(callState.id);
        // State cleared via socket events:
        // 1. call:ended → broadcast to all participants
        // 2. session → null, room disconnects

      } else {
        // Participant leaves call
        await leave(callState.id);
        // State cleared via socket events
      }

    } catch (error) {
      console.error("Failed to end/leave call:", error);
    }
  };

  if (!room) {
    return null;
  }

  return (
    <button onClick={handleEndCall} className="end-call-btn">
      {initiated ? "End Call" : "Leave Call"}
    </button>
  );
}
```

---

## LiveKit Integration

### Using LiveKit Components

The SDK re-exports all LiveKit components and hooks for convenience:

```tsx
import {
  useRoom,
  // LiveKit hooks (re-exported)
  useParticipants,
  useTracks,
  useLocalParticipant,
  useRemoteParticipants,
  useConnectionState,
  useIsSpeaking,
  useTrackToggle,
  // LiveKit components (re-exported)
  VideoTrack,
  AudioTrack,
  ParticipantContext,
  RoomAudioRenderer,
} from "@voyatek/callpad-sdk";
import { Track } from "livekit-client";

function AdvancedVideoUI() {
  const room = useRoom();
  const localParticipant = useLocalParticipant({ room });
  const remoteParticipants = useRemoteParticipants({ room });
  const connectionState = useConnectionState(room);

  return (
    <div>
      <p>Connection: {connectionState}</p>

      {/* Local participant video */}
      {localParticipant && (
        <ParticipantContext.Provider value={localParticipant}>
          <VideoTrack source={Track.Source.Camera} />
        </ParticipantContext.Provider>
      )}

      {/* Remote participants */}
      {remoteParticipants.map((participant) => (
        <ParticipantContext.Provider key={participant.sid} value={participant}>
          <VideoTrack source={Track.Source.Camera} />
        </ParticipantContext.Provider>
      ))}

      {/* Render audio for all participants */}
      <RoomAudioRenderer />
    </div>
  );
}
```

### Advanced Room Features

```tsx
import { useRoom } from "@voyatek/callpad-sdk";
import { RoomEvent, DataPacket_Kind } from "livekit-client";
import { useEffect } from "react";

function AdvancedRoomFeatures() {
  const room = useRoom();

  useEffect(() => {
    if (!room) return;

    // Listen to room events
    const handleDataReceived = (
      payload: Uint8Array,
      participant: any,
      kind: DataPacket_Kind
    ) => {
      const text = new TextDecoder().decode(payload);
      console.log("Data received:", text, "from:", participant.identity);
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  const sendData = () => {
    if (!room) return;

    const encoder = new TextEncoder();
    const data = encoder.encode("Hello from participant!");
    room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
  };

  return <button onClick={sendData}>Send Data</button>;
}
```

---

## State Management

### State Structure

```typescript
interface RtcState {
  // Did we initiate the current call?
  initiated: boolean;

  // Active session (null when no active call)
  session: Session | null;

  // Incoming invitation (null when no pending invite)
  incomingInvite: IncomingInvite | null;

  // Outgoing invites (when I'm the HOST/caller)
  outgoingInvites: Record<string, OutgoingInvite>;

  // Error tracking
  errors: RtcError[];
}

interface Session {
  id: string;
  status: "pending" | "active" | "ended";
  mode: "AUDIO" | "VIDEO";
  role: "HOST" | "PARTICIPANT" | "GUEST";
  livekitInfo?: {
    token: string;
    roomName: string;
    url: string;
  };
}
```

### Direct State Access

You can access the Zustand store directly if needed:

```tsx
import { useSdk } from "@voyatek/callpad-sdk";

function AdvancedStateAccess() {
  const sdk = useSdk();

  // Subscribe to specific state
  const errors = sdk.store((state) => state.errors);
  const session = sdk.store((state) => state.session);

  // Access selectors
  const outgoingInvites = sdk.store(selectOutgoingInvites);

  return (
    <div>
      <h3>Errors ({errors.length})</h3>
      {errors.map((err, i) => (
        <div key={i}>{err.message}</div>
      ))}
    </div>
  );
}
```

---

## Error Handling

### Handling API Errors

```tsx
import { useCallActions } from "@voyatek/callpad-sdk";

function ErrorHandlingExample() {
  const { accept } = useCallActions();

  const handleAccept = async (callId: string) => {
    try {
      await accept(callId);
    } catch (error: any) {
      // Check HTTP status codes
      if (error.status === 403) {
        console.error("Not authorized to accept this call");
      } else if (error.status === 404) {
        console.error("Call not found");
      } else if (error.status === 409) {
        console.error("Call cannot be accepted in current state");
      } else {
        console.error("Failed to accept call:", error.message);
      }
    }
  };

  return <button onClick={() => handleAccept("call-id")}>Accept</button>;
}
```

### Tracking SDK Errors

```tsx
import { useSdk } from "@voyatek/callpad-sdk";

function ErrorDisplay() {
  const sdk = useSdk();
  const errors = sdk.store((state) => state.errors);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="error-banner">
      {errors.map((error, i) => (
        <div key={i} className="error-item">
          <strong>{error.code}</strong>: {error.message}
          <button onClick={() => sdk.store.getState().clearErrors()}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Complete Example

Here's a complete working example combining all features:

```tsx
import {
  RtcProvider,
  useIncomingInvite,
  useCallActions,
  useCallState,
  useCallInitiated,
  useRoom,
  useParticipants,
  useTracks,
  VideoTrack,
  RoomAudioRenderer,
} from "@voyatek/callpad-sdk";
import { Track } from "livekit-client";
import { useState } from "react";

// 1. Wrap your app
function App() {
  return (
    <RtcProvider
      options={{
        appId: "my-app",
        signalHost: "https://signal.myapp.com",
        authProvider: () => localStorage.getItem("jwt"),
      }}
    >
      <CallApp />
    </RtcProvider>
  );
}

// 2. Main call component
function CallApp() {
  const invite = useIncomingInvite();
  const callState = useCallState();
  const room = useRoom();

  // Show incoming call dialog
  if (invite && !callState.id) {
    return <IncomingCallDialog invite={invite} />;
  }

  // Show active call UI
  if (callState.status === "active" && room) {
    return <ActiveCallUI />;
  }

  // Show call initiator
  return <CallInitiator />;
}

// 3. Incoming call dialog
function IncomingCallDialog({ invite }: { invite: IncomingInvite }) {
  const { accept, decline } = useCallActions();

  return (
    <div className="incoming-call">
      <h2>{invite.caller.firstName} is calling</h2>
      <p>Mode: {invite.mode}</p>
      <button onClick={() => accept(invite.callId)}>Accept</button>
      <button onClick={() => decline(invite.callId)}>Decline</button>
    </div>
  );
}

// 4. Call initiator
function CallInitiator() {
  const { initiate } = useCallActions();
  const [participants, setParticipants] = useState("");

  const startCall = async () => {
    const userIds = participants.split(",").map((id) => id.trim());
    await initiate(userIds, "VIDEO");
  };

  return (
    <div>
      <h2>Start a Call</h2>
      <input
        placeholder="User IDs (comma-separated)"
        value={participants}
        onChange={(e) => setParticipants(e.target.value)}
      />
      <button onClick={startCall}>Start Video Call</button>
    </div>
  );
}

// 5. Active call UI
function ActiveCallUI() {
  const room = useRoom();
  const { end, leave } = useCallActions();
  const callState = useCallState();
  const initiated = useCallInitiated();
  const participants = useParticipants({ room });
  const tracks = useTracks([Track.Source.Camera], { room });
  const [isMuted, setIsMuted] = useState(false);

  if (!room || !callState.id) return null;

  const toggleMute = async () => {
    await room.localParticipant.setMicrophoneEnabled(isMuted);
    setIsMuted(!isMuted);
  };

  const endCall = async () => {
    if (initiated) {
      await end(callState.id);
    } else {
      await leave(callState.id);
    }
  };

  return (
    <div className="active-call">
      <div className="video-grid">
        {tracks.map((track) => (
          <div key={track.participant.identity}>
            <VideoTrack {...track} />
            <p>{track.participant.identity}</p>
          </div>
        ))}
      </div>

      <RoomAudioRenderer />

      <div className="controls">
        <button onClick={toggleMute}>
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button onClick={endCall} className="end-call">
          {initiated ? "End Call" : "Leave"}
        </button>
      </div>

      <div className="info">
        <p>Participants: {participants.length}</p>
        <p>Status: {callState.status}</p>
        <p>Role: {initiated ? "Host" : "Participant"}</p>
      </div>
    </div>
  );
}

export default App;
```

---

## TypeScript Support

The SDK is fully typed. Import types as needed:

```typescript
import type {
  RtcOptions,
  CallState,
  IncomingInvite,
  OutgoingInvite,
  Session,
  RtcState,
  ParticipantInfo,
} from "@voyatek/callpad-sdk";

// LiveKit types are also re-exported
import type {
  Room,
  Participant,
  Track,
  RoomOptions,
} from "@voyatek/callpad-sdk";
```

---

## Best Practices

### 1. Handle All Call States

Always account for all possible states in your UI:

```tsx
function CallComponent() {
  const invite = useIncomingInvite();
  const callState = useCallState();
  const room = useRoom();

  // Incoming invite
  if (invite && !callState.id) {
    return <IncomingCallDialog />;
  }

  // Pending connection
  if (callState.status === "pending") {
    return <LoadingScreen />;
  }

  // Active call
  if (callState.status === "active" && room) {
    return <ActiveCall />;
  }

  // No call
  return <IdleScreen />;
}
```

### 2. Clean Up on Unmount

The SDK handles cleanup automatically, but always clean up your own listeners:

```tsx
useEffect(() => {
  if (!room) return;

  const handler = () => { /* ... */ };
  room.on(RoomEvent.ParticipantConnected, handler);

  return () => {
    room.off(RoomEvent.ParticipantConnected, handler);
  };
}, [room]);
```

### 3. Error Boundaries

Wrap your call UI in error boundaries:

```tsx
import { ErrorBoundary } from "react-error-boundary";

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <RtcProvider options={config}>
        <CallApp />
      </RtcProvider>
    </ErrorBoundary>
  );
}
```

### 4. Optimize Re-renders

Use specific state selectors to avoid unnecessary re-renders:

```tsx
// ❌ Bad - re-renders on any state change
const state = useSdk().store((state) => state);

// ✅ Good - only re-renders when session changes
const session = useSdk().store((state) => state.session);
```

---

## Authorization & Security

### How Authorization Works

The SDK automatically handles authorization for all API requests to the signal server. Here's how it works:

1. **Token Provider**: You provide an `authProvider` function when initializing the SDK:
```tsx
<RtcProvider
  options={{
    authProvider: () => getYourJWTToken(), // Returns JWT token
    // ... other options
  }}
>
```

2. **Automatic Token Injection**: The SDK configures the API client during initialization to:
   - Call your `authProvider` function before each request
   - Add the token as an `Authorization: Bearer {token}` header
   - Handle token refresh automatically

3. **Request Flow**:
```
API Call → Token Provider → Add Auth Header → Signal Server
   (e.g., accept())  →  authProvider()  →  Authorization: Bearer xxx  →  Request
```

### Token Requirements

Your `authProvider` function should:
- Return a valid JWT token as a string
- Return `null` if no token is available
- Be synchronous or asynchronous (both are supported)

```tsx
// Synchronous example
const authProvider = () => {
  return localStorage.getItem("jwt_token");
};

// Asynchronous example
const authProvider = async () => {
  const token = await refreshTokenIfNeeded();
  return token;
};
```

### Debugging Authorization

The SDK includes built-in logging to help debug authorization issues:

```tsx
<RtcProvider
  options={{
    logLevel: "debug", // Enable debug logs
    enableDebug: true,
    authProvider: () => getToken(),
  }}
>
```

With debug logging enabled, you'll see messages like:
- `"Token resolved successfully"` - Token was obtained from your provider
- `"Token provider returned empty token"` - Your provider returned null/empty
- `"API Request with Authorization header"` - Request includes auth header
- `"API Request WITHOUT Authorization header"` - Warning: no auth header

### Common Authorization Issues

#### 1. Token Not Being Sent

**Symptom**: Getting 401 Unauthorized errors

**Solution**: Check that your `authProvider` is returning a valid token:
```tsx
const authProvider = () => {
  const token = getToken();
  console.log("Token:", token); // Debug log
  return token;
};
```

#### 2. Expired Tokens

**Symptom**: Requests succeed initially but fail after some time

**Solution**: Implement token refresh in your provider:
```tsx
const authProvider = async () => {
  const token = getStoredToken();

  if (isTokenExpired(token)) {
    const refreshed = await refreshToken();
    storeToken(refreshed);
    return refreshed;
  }

  return token;
};
```

#### 3. Token Provider Not Called

**Symptom**: `authProvider` logs not appearing

**Solution**: Ensure the SDK is properly initialized and API is being called:
```tsx
// Make sure RtcProvider is mounted
<RtcProvider options={{ authProvider, ... }}>
  <YourApp />
</RtcProvider>
```

### Security Best Practices

1. **Never hardcode tokens** in your code
2. **Store tokens securely** (use httpOnly cookies for web apps)
3. **Implement token refresh** to avoid expired token issues
4. **Use HTTPS** for all API communication
5. **Keep tokens short-lived** (15-60 minutes) with refresh capability

---

## Troubleshooting

### Call Not Connecting

1. Check that `authProvider` returns a valid JWT token
2. Verify `signalHost` is correct and accessible
3. Check browser console for socket connection errors
4. Ensure LiveKit server is running and accessible

### No Audio/Video

1. Check browser permissions for microphone/camera
2. Verify LiveKit room is properly connected: `room.state === ConnectionState.Connected`
3. Check that tracks are published: `room.localParticipant.isMicrophoneEnabled`
4. Inspect network tab for WebRTC connection issues

### State Not Updating

1. Verify socket connection is established
2. Check that JWT token is valid and not expired
3. Ensure you're subscribed to the correct socket rooms
4. Check browser console for socket event errors

---

## Support

For issues, questions, or contributions:
- GitHub: [your-repo-url]
- Email: support@yourapp.com
- Docs: https://docs.yourapp.com



lastName: callerInfo?.lastName,
username: callerInfo?.username,
email: callerInfo?.email,
profilePhoto: callerInfo?.profilePhoto,
}