# VG CallPad SDK Documentation

Welcome to the VG CallPad SDK documentation! This SDK provides a comprehensive React-based solution for integrating video and audio calling capabilities into your applications, built on top of LiveKit for optimal real-time communication.

## 🚀 Quick Start

New to the SDK? Start here:

1. **[Basic Setup](./basic-setup.md)** - Initialize the SDK and wrap your app with the provider
2. **[Simple Participant](./simple-participant.md)** - Display participant video/audio with just 3 hooks

## 📚 Documentation Guide

### Core Concepts

- **LiveKit Integration** - Built on LiveKit WebRTC framework for optimal performance
- **React Hooks Pattern** - Simple, composable hooks for media management
- **Call Type Awareness** - Automatic track management based on AUDIO vs VIDEO calls
- **Event-Driven Architecture** - Real-time updates for all call state changes

### Implementation Guides

| Guide | Description | When to Use |
|-------|-------------|-------------|
| **[Basic Setup](./basic-setup.md)** | SDK initialization and provider setup | Required for all implementations |
| **[Simple Participant](./simple-participant.md)** | 3-line track attachment approach | Quick prototypes, simple displays |
| **[Advanced Participant](./advanced-participant.md)** | Production-ready with error handling | Production apps, complex UIs |
| **[Audio Activation](./audio-activation.md)** | Handle browser autoplay restrictions | When you need audio playback |
| **[Complete Interface](./complete-interface.md)** | Full production call interface | Complete calling applications |

## 🎯 Choose Your Path

### Just Getting Started?
```
Basic Setup → Simple Participant → You're calling! 🎉
```

### Building for Production?
```
Basic Setup → Advanced Participant → Audio Activation → Complete Interface
```

### Need Specific Features?
- **Audio/Video Tracks** → [Simple Participant](./simple-participant.md)
- **Error Handling** → [Advanced Participant](./advanced-participant.md)  
- **Browser Audio Issues** → [Audio Activation](./audio-activation.md)
- **Full Call UI** → [Complete Interface](./complete-interface.md)

## 🏗️ Architecture Overview

The SDK follows a layered architecture:

```
┌─────────────────────────────────────┐
│           Your React App            │
├─────────────────────────────────────┤
│         SDK React Hooks            │
│  useParticipants, useCallState,     │
│  useParticipantMedia, etc.          │
├─────────────────────────────────────┤
│          SDK Core Layer             │
│   Call management, state, events    │
├─────────────────────────────────────┤
│           LiveKit Client            │
│    WebRTC, media, networking        │
└─────────────────────────────────────┘
```

**Key Benefits:**
- ✅ **Simple Integration** - Just hooks and components
- ✅ **LiveKit Optimized** - Adaptive streaming and quality management
- ✅ **Production Ready** - Error handling, browser compatibility
- ✅ **Type Safe** - Full TypeScript support

## 🔧 Core Hooks Reference

### Essential Hooks
```typescript
// Get all participants in the call
const participants = useParticipants();

// Get current call state and actions
const { status, mode, isConnected } = useCallState();
const { endCall, acceptCall, declineCall } = useCallActions();

// Get media tracks for a participant (the key hook!)
const { camera, microphone, hasCamera, hasMicrophone } = useParticipantMedia(participantId);

// Control your own media
const { isCameraEnabled, isMicrophoneEnabled, enableCamera, disableCamera } = useMediaControls();
```

### Specialized Hooks
```typescript
// Handle browser autoplay restrictions
const { needsUserInteraction, startAudio } = useAudioPlayback();

// Get call-type-aware track management
const { } = useCallTypeTracks({ enableCameraOnVideoCall: true });

// Monitor call quality and connection
const { quality, connectionState } = useCallQuality();
```

## 🎨 UI Patterns

### The LiveKit Way
The SDK provides LiveKit track objects, so you use the official `track.attach()` method:

```typescript
// ✅ Recommended: LiveKit's track.attach()
const videoElement = camera.attach() as HTMLVideoElement;
videoElement.autoplay = true;
videoElement.playsInline = true;
videoContainerRef.current.appendChild(videoElement);

// Cleanup
return () => camera.detach(videoElement);
```

```typescript
// ❌ Not recommended: Manual elements
const videoElement = document.createElement('video');
videoElement.srcObject = camera.mediaStreamTrack; // Missing LiveKit optimization
```

### Common Patterns

**Single Participant View**
```typescript
function CallView({ participantId }: { participantId: string }) {
  const participants = useParticipants();
  const participant = participants.find(p => p.id === participantId);
  
  return <SimpleParticipant participant={participant} />;
}
```

**Grid Layout**
```typescript
function ParticipantGrid() {
  const participants = useParticipants();
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {participants.map(participant => (
        <SimpleParticipant key={participant.id} participant={participant} />
      ))}
    </div>
  );
}
```

**Local vs Remote Detection**
```typescript
function CallInterface() {
  const participants = useParticipants();
  const { session } = useCallState();
  
  return (
    <div>
      {participants.map(participant => (
        <SimpleParticipant
          key={participant.id}
          participant={participant}
          isLocal={participant.id === session.myParticipantId}
        />
      ))}
    </div>
  );
}
```

## 🌟 Key Features

### Automatic Track Management
- **Call Type Awareness** - Enables right tracks for AUDIO vs VIDEO calls
- **State-Based Control** - Tracks enabled/disabled based on call state
- **Network Adaptation** - LiveKit handles quality optimization automatically

### Browser Compatibility
- **Autoplay Handling** - Manages browser audio restrictions
- **Mobile Support** - Works on iOS Safari, Android Chrome
- **WebRTC Optimization** - Leverages LiveKit's cross-browser compatibility

### Production Ready
- **Error Recovery** - Automatic reconnection and error handling
- **Memory Management** - Proper track cleanup and resource management
- **TypeScript Support** - Full type safety throughout the SDK

## 🤝 Common Integration Patterns

### Next.js Integration
```typescript
// pages/_app.tsx
import { RtcProvider } from 'vg-x07df';

export default function App({ Component, pageProps }) {
  return (
    <RtcProvider authUrl="/api/auth" signalUrl="wss://signal.example.com">
      <Component {...pageProps} />
    </RtcProvider>
  );
}
```

### Existing React App
```typescript
// App.tsx
import { RtcProvider } from 'vg-x07df';
import { CallInterface } from './components/CallInterface';

function App() {
  return (
    <RtcProvider authUrl="/api/auth" signalUrl="wss://signal.example.com">
      <div className="app">
        <CallInterface />
      </div>
    </RtcProvider>
  );
}
```

### Component Library Integration
```typescript
// Export SDK components for use in other apps
export { SimpleParticipant } from './components/SimpleParticipant';
export { AdvancedParticipant } from './components/AdvancedParticipant';
export * from 'vg-x07df'; // Re-export all SDK hooks
```

## 🔍 Troubleshooting

### Common Issues

**No Audio/Video**
- Check browser permissions for camera/microphone
- Verify tracks are enabled with `useMediaControls()`
- Use [Audio Activation](./audio-activation.md) for autoplay issues

**Participants Not Showing**
- Ensure `useParticipants()` returns data
- Check call state with `useCallState()`
- Verify participant tracks with `useParticipantMedia()`

**Performance Issues**
- Use LiveKit's `track.attach()` for optimization
- Implement proper cleanup in `useEffect` returns
- Consider participant limit for grid layouts

## 📖 API Reference

For detailed API documentation, see the individual guide files:
- Hook signatures and return types
- Component props and interfaces  
- Event types and payloads
- Configuration options

## 🚀 Next Steps

1. **Start with [Basic Setup](./basic-setup.md)** to initialize the SDK
2. **Build your first participant view** with [Simple Participant](./simple-participant.md)
3. **Add production features** from [Advanced Participant](./advanced-participant.md)
4. **Handle audio requirements** with [Audio Activation](./audio-activation.md)
5. **Create a complete interface** using [Complete Interface](./complete-interface.md)

Ready to build amazing calling experiences? Let's get started! 🎉