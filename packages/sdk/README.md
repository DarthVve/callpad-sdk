# CallPad SDK

Production-ready headless SDK for CallPad audio/video calls with React integration.

## Installation

```bash
npm install vg-callpad-x07df
# or
yarn add vg-callpad-x07df
# or
pnpm add vg-callpad-x07df
```

## Quick Start

```tsx
import { CallpadSdkProvider, useCallActions, useCallState } from 'vg-callpad-x07df';

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
import { LiveKitProvider, useTrack } from 'vg-callpad-x07df/livekit';

// Access LiveKit room and tracks directly
const track = useTrack();
```

## Requirements

- React ≥18.0.0
- React DOM ≥18.0.0
- LiveKit Client ≥2.8.0
- Socket.IO Client ≥4.7.0

## TypeScript Support

This package includes full TypeScript definitions. No additional @types packages needed.

```tsx
import type { CallState, Participant, CallQuality } from 'vg-callpad-x07df';
```