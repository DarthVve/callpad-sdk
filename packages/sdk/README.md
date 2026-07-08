# CallPad SDK

Production-ready headless SDK for CallPad audio/video calls with React integration.

## Installation

```bash
npm install vg-x07df
# or
yarn add vg-x07df
# or
pnpm add vg-x07df
```

## Quick Start

```tsx
import { CallpadSdkProvider, useCallActions, useCallState } from 'vg-x07df';

function App() {
  return (
    <CallpadSdkProvider config={{ apiUrl: 'your-api-url' }}>
      <CallInterface />
    </CallpadSdkProvider>
  );
}

function CallInterface() {
  const { initiate, accept, end } = useCallActions();
  const { status, participants } = useCallState();

  const handleStartCall = () => {
    initiate(['user@example.com'], 'VIDEO');
  };

  return (
    <div>
      <h1>Call Status: {status}</h1>
      <button onClick={handleStartCall}>Start Video Call</button>
      <div>Participants: {participants.length}</div>
    </div>
  );
}
```

## Features

- 🎥 **Audio & Video Calls** - High-quality real-time communication
- ⚡ **React Hooks** - Modern React integration with custom hooks
- 🔧 **Headless UI** - Bring your own UI components
- 📱 **Responsive** - Works across desktop and mobile
- 🔒 **Secure** - End-to-end encrypted communications
- 🎛️ **Media Controls** - Camera, microphone, and screen sharing
- 👥 **Multi-participant** - Support for group calls
- 📊 **Call Quality** - Real-time quality monitoring
- 🔔 **Event System** - Comprehensive call event handling

## API Reference

### Providers

- `CallpadSdkProvider` - Main provider component for SDK configuration

### Hooks

- `useCallActions()` - Actions for managing calls (initiate, accept, decline, end, cancel)
- `useCallState()` - Current call state and session information
- `useParticipants()` - Participant management and information
- `useMediaControls()` - Camera, microphone, and screen sharing controls
- `useDevices()` - Audio/video device selection
- `useEvent()` - SDK event subscriptions  
- `useCallQuality()` - Real-time call quality metrics
- `useErrors()` - Error handling and management

### LiveKit Integration

```tsx
import { LiveKitProvider, useTrack } from 'vg-x07df/livekit';

// Access LiveKit room and tracks directly
const track = useTrack();
```

## Video Call Features

### Video Initialization

The SDK automatically initializes camera capability but keeps it disabled by default for privacy:

- Camera permissions are requested when the room connects
- Video starts disabled (privacy-first approach)
- Users must explicitly enable video via UI controls
- Room is optimized with adaptive streaming and dynacast for performance

### Using Video Controls

```tsx
import { useTrackToggle, Track } from "vg-x07df/livekit";

function VideoControls() {
  // Toggle video on/off
  const { toggle: toggleVideo, enabled: isVideoEnabled } = useTrackToggle({
    source: Track.Source.Camera
  });

  return (
    <button onClick={toggleVideo}>
      {isVideoEnabled ? "Turn Off Video" : "Turn On Video"}
    </button>
  );
}
```

### Displaying Video

```tsx
import { VideoTrack, useParticipantTracks, Track } from "vg-x07df/livekit";
import { hasVideoTrack } from "vg-x07df/utils";

function ParticipantVideo({ participant }) {
  const tracks = useParticipantTracks(participant, Track.Source.Camera);
  
  return (
    <div className="participant-container">
      {hasVideoTrack(participant) ? (
        <VideoTrack 
          participant={participant} 
          source={Track.Source.Camera}
          className="video-element"
        />
      ) : (
        <div className="avatar-fallback">
          {participant.identity}
        </div>
      )}
    </div>
  );
}
```

### Video Utilities

The SDK provides utility functions for common video operations:

```tsx
import { hasVideoTrack, getVideoTrack, hasVideoCapability } from "vg-x07df/utils";

// Check if participant has active video (enabled and published)
const hasActiveVideo = hasVideoTrack(participant);

// Get video track publication
const videoTrack = getVideoTrack(participant);

// Check if video capability exists (track exists, may be muted)
const canHaveVideo = hasVideoCapability(participant);
```

### Complete Video Implementation Example

```tsx
import { 
  VideoTrack, 
  useTrackToggle, 
  useParticipantTracks, 
  Track,
  useParticipants 
} from "vg-x07df/livekit";
import { hasVideoTrack } from "vg-x07df/utils";

function VideoCallInterface() {
  const participants = useParticipants();
  const { toggle: toggleVideo, enabled: isVideoEnabled } = useTrackToggle({ 
    source: Track.Source.Camera 
  });

  return (
    <div className="video-call-container">
      {/* Video Controls */}
      <div className="controls">
        <button onClick={toggleVideo}>
          {isVideoEnabled ? "Turn Off Video" : "Turn On Video"}
        </button>
      </div>

      {/* Participant Videos */}
      <div className="participants-grid">
        {participants.map((participant) => (
          <div key={participant.identity} className="participant-tile">
            {hasVideoTrack(participant) ? (
              <VideoTrack 
                participant={participant} 
                source={Track.Source.Camera}
                className="video-element"
              />
            ) : (
              <div className="avatar-placeholder">
                {participant.identity.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="participant-name">
              {participant.identity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Video Troubleshooting

**Camera permissions denied:**
- The SDK handles permissions gracefully
- Users will see a browser permission prompt on first video toggle
- If permissions are denied, the call continues as audio-only
- Check browser settings if video toggle doesn't work

**Video not appearing:**
- Verify `hasVideoTrack(participant)` returns `true`
- Check that `useTrackToggle` shows `enabled: true`
- Ensure the `VideoTrack` component has the correct `participant` prop
- Confirm the participant has published their video track

**Performance issues with multiple videos:**
- The SDK uses optimized settings (720p, adaptive streaming, dynacast)
- Video quality automatically adjusts based on available bandwidth
- Multiple video streams are handled efficiently with simulcast
- Consider reducing video quality for low-bandwidth scenarios

**Audio works but video doesn't:**
- Check if camera is being used by another application
- Verify camera permissions in browser settings
- Try refreshing the page to reinitialize camera access
- Check browser console for camera-related errors

## Requirements

- React ≥18.0.0
- React DOM ≥18.0.0
- LiveKit Client ≥2.8.0
- Socket.IO Client ≥4.7.0

## TypeScript Support

This package includes full TypeScript definitions. No additional @types packages needed.

```tsx
import type { CallState, Participant, CallQuality } from 'vg-x07df';
```