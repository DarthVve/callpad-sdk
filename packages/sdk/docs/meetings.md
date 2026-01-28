## Meetings

The SDK supports two modes for joining meetings:
- **Authenticated mode**: For logged-in users with existing authentication
- **Guest mode**: For users joining without authentication

### Provider Setup

#### Authenticated Mode

```tsx
import { RtcProvider } from 'vg-x07df';

function App() {
  return (
    <RtcProvider options={{
      appId: "your-app-id",
      signalHost: "https://signal.example.com",
      authProvider: () => getAccessToken(), // Your JWT token provider
    }}>
      <MeetingApp />
    </RtcProvider>
  );
}
```

#### Guest Mode

```tsx
import { RtcProvider } from 'vg-x07df';

function GuestApp() {
  return (
    <RtcProvider options={{
      mode: "guest",
      appId: "your-app-id",
      signalHost: "https://signal.example.com",
      deviceId: getOrCreateDeviceId(), // Unique device identifier
    }}>
      <GuestMeetingApp />
    </RtcProvider>
  );
}
```

---

### Joining as an Authenticated User

#### Using Hooks

```tsx
import { useMeetingActions, useMeetingState, useAutoConnectRoom } from 'vg-x07df';

function MeetingJoin() {
  const { join, leave } = useMeetingActions();
  const { isInMeeting, meetingCode } = useMeetingState();
  const room = useAutoConnectRoom(); // Auto-connects when meeting is joined

  const handleJoin = async () => {
    try {
      await join({ meetingCode: "ABC-123" });
      // LiveKit room connects automatically after successful join
    } catch (error) {
      console.error("Failed to join:", error);
    }
  };

  if (isInMeeting) {
    return (
      <div>
        <p>In meeting: {meetingCode}</p>
        <button onClick={leave}>Leave Meeting</button>
      </div>
    );
  }

  return <button onClick={handleJoin}>Join Meeting</button>;
}
```

#### Join Parameters

```typescript
interface JoinMeetingParams {
  meetingCode?: string;  // Meeting code (e.g., "ABC-123")
  meetingId?: string;    // Or meeting ID
}
// At least one of meetingCode or meetingId is required
```

#### Combined Hook

```tsx
import { useMeeting } from 'vg-x07df';

function MeetingComponent() {
  const {
    // State
    isInMeeting,
    meetingId,
    meetingCode,
    isOrganizer,
    // Actions
    join,
    leave,
    end,
    createAdHoc,
    start
  } = useMeeting();

  // ...
}
```

---

### Joining as a Guest

Guests can join meetings without authentication using the guest SDK mode.

#### Setup

```tsx
import { RtcProvider, useGuestJoin, useGuestIdentity, useIsGuestMode } from 'vg-x07df';

function GuestApp() {
  return (
    <RtcProvider options={{
      mode: "guest",
      appId: "your-app-id",
      signalHost: "https://signal.example.com",
      deviceId: localStorage.getItem("deviceId") || generateDeviceId(),
    }}>
      <GuestJoinScreen />
    </RtcProvider>
  );
}
```

#### Guest Join Flow

```tsx
import {
  useGuestJoin,
  useGuestIdentity,
  useMeetingState,
  useAutoConnectRoom,
  GuestJoinError
} from 'vg-x07df';

function GuestJoinScreen() {
  const { guestJoin } = useGuestJoin();
  const guestIdentity = useGuestIdentity();
  const { isInMeeting } = useMeetingState();
  const room = useAutoConnectRoom();

  const [displayName, setDisplayName] = useState("");
  const [meetingCode, setMeetingCode] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    try {
      await guestJoin({
        meetingCode,
        displayName,
        passcode, // Optional - required if meeting has passcode
      });
      // Socket connects automatically after successful join
      // LiveKit room connects via useAutoConnectRoom
    } catch (err) {
      if (err instanceof GuestJoinError) {
        switch (err.code) {
          case "INVALID_PASSCODE":
            setError("Invalid passcode");
            break;
          case "MEETING_NOT_ACTIVE":
            setError("Meeting has not started yet");
            break;
          case "GUEST_ACCESS_DISABLED":
            setError("Guest access is not allowed for this meeting");
            break;
          case "SESSION_NOT_FOUND":
            setError("Meeting not found");
            break;
          default:
            setError("Failed to join meeting");
        }
      }
    }
  };

  if (isInMeeting && guestIdentity) {
    return <p>Joined as {guestIdentity.displayName}</p>;
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleJoin(); }}>
      <input
        placeholder="Your name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
      />
      <input
        placeholder="Meeting code"
        value={meetingCode}
        onChange={(e) => setMeetingCode(e.target.value)}
        required
      />
      <input
        placeholder="Passcode (if required)"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Join as Guest</button>
    </form>
  );
}
```

#### Guest Join Parameters

```typescript
interface GuestJoinMeetingParams {
  meetingCode: string;   // Meeting code (required)
  displayName: string;   // Guest's display name (required)
  passcode?: string;     // Meeting passcode (if required)
}
```

#### Guest Permissions

Guests have restricted permissions compared to authenticated users:

```tsx
import { useGuestPermissions } from 'vg-x07df';

function GuestControls() {
  const permissions = useGuestPermissions();

  // permissions = {
  //   canMute: false,       // Cannot mute other participants
  //   canKick: false,       // Cannot remove participants
  //   canTransfer: false,   // Cannot transfer calls
  //   canEnd: false,        // Cannot end meeting for all
  //   canRecord: false,     // Cannot start recording
  //   canShareScreen: true, // Can share screen
  // }
}
```

---

### Guest Error Handling

```typescript
import { GuestJoinError, type GuestErrorCode } from 'vg-x07df';

// Error codes:
type GuestErrorCode =
  | "SESSION_NOT_FOUND"      // 404 - Meeting not found
  | "GUEST_ACCESS_DISABLED"  // 403 - Guest access not allowed
  | "INVALID_PASSCODE"       // 401 - Wrong passcode
  | "MEETING_NOT_ACTIVE"     // 400 - Meeting hasn't started
  | "VALIDATION_ERROR"       // 422 - Invalid input
  | "UNKNOWN";               // Other errors
```

---

### Guest vs Authenticated Comparison

| Feature | Authenticated | Guest |
|---------|--------------|-------|
| Join meeting | Yes | Yes |
| Create meeting | Yes | No |
| End meeting | Yes (host) | No |
| Mute others | Yes (host) | No |
| Kick participants | Yes (host) | No |
| Start recording | Yes (host) | No |
| Share screen | Yes | Yes |
| Session persistence | Yes | No (ephemeral) |

---

### Leaving a Meeting

Both authenticated and guest users use the same leave flow:

```tsx
import { useMeetingActions } from 'vg-x07df';

function LeaveButton() {
  const { leave } = useMeetingActions();

  const handleLeave = async () => {
    await leave();
    // State automatically resets
    // Socket disconnects
    // For guests: guestIdentity and isGuestMode reset
  };

  return <button onClick={handleLeave}>Leave Meeting</button>;
}
```

---

### Meeting Events

Subscribe to meeting lifecycle events:

```tsx
import { useEvent, SdkEventType } from 'vg-x07df';

function MeetingEventHandler() {
  // Authenticated user events
  useEvent(SdkEventType.MEETING_JOINED, (event) => {
    console.log("Joined meeting");
  });

  useEvent(SdkEventType.MEETING_ENDED, (event) => {
    console.log("Meeting ended");
  });

  // Guest-specific events
  useEvent(SdkEventType.GUEST_JOINED, (event) => {
    console.log("Guest joined:", event.payload.displayName);
  });

  useEvent(SdkEventType.GUEST_LEFT, (event) => {
    console.log("Guest left meeting");
  });

  useEvent(SdkEventType.GUEST_KICKED, (event) => {
    console.log("Guest was removed:", event.payload.reason);
  });

  return null;
}
```

---

### TypeScript Types

```typescript
import type {
  // Options
  AuthenticatedSdkOptions,
  GuestSdkOptions,
  SdkBuildOptions,

  // SDK instances
  RtcSdk,
  GuestRtcSdk,

  // Meeting types
  JoinMeetingParams,
  GuestJoinMeetingParams,
  GuestJoinResponse,

  // State types
  GuestIdentity,
  MeetingInfo,
  Session,

  // Errors
  GuestErrorCode,
} from 'vg-x07df';

import { GuestJoinError } from 'vg-x07df';
```
