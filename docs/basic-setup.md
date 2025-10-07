# Basic SDK Setup for External React Apps

This guide shows how to set up the VG CallPad SDK in any React application. The SDK handles all LiveKit complexity and provides simple React hooks for building video calling features.

## Overview

The VG CallPad SDK is designed to be drop-in ready for any React application. You just need to:

1. **Install the package** and configure the SDK options
2. **Wrap your app** with the `RtcProvider` 
3. **Use the hooks** anywhere in your component tree

## Installation

```bash
# Install the SDK package
npm install vg-x07df
# or
yarn add vg-x07df
# or  
pnpm add vg-x07df
```

## Quick Start

### 1. Configure SDK Options

First, create your SDK configuration with your app credentials and settings:

```typescript
import { type RtcOptions } from 'vg-x07df';

const sdkOptions: RtcOptions = {
  // Required: Your application identifier
  appId: 'your-app-id',
  
  // Required: WebSocket URL for your signal server
  signalHost: 'wss://your-signal-server.com',
  
  // Required: Function that returns your JWT authentication token
  authProvider: () => {
    // Your auth logic here - return JWT token or null
    return localStorage.getItem('auth-token');
  },
  
  // Optional: Configure logging for debugging
  logLevel: 'info',        // 'debug' | 'info' | 'warn' | 'error'
  enableDebug: true,       // Enable additional debug information
  log: (level, message, meta) => {
    console.log(`[${level.toUpperCase()}]`, message, meta);
  },
  
  // Optional: Auto-join configuration for calls
  autoJoin: {
    enabled: true,         // Enable automatic joining of calls
    retryOnFailure: true,  // Retry if join fails
    maxRetries: 3,         // Maximum number of retry attempts
  },
};
```

### 2. Wrap Your App with RtcProvider

The `RtcProvider` initializes the SDK and makes it available to all child components:

```typescript
import React from 'react';
import { RtcProvider } from 'vg-x07df';
import { sdkOptions } from './config'; // Your configuration from above

export function App() {
  return (
    <RtcProvider options={sdkOptions}>
      <div className="app">
        <h1>My Video Call App</h1>
        <CallInterface />
      </div>
    </RtcProvider>
  );
}
```

### 3. Use SDK Hooks in Components

Once wrapped with `RtcProvider`, any child component can use the SDK hooks:

```typescript
import { 
  useCallState, 
  useParticipants, 
  useMediaControls 
} from 'vg-x07df';

function CallInterface() {
  // Get call status and information
  const { status } = useCallState();
  
  // Get all participants in the call
  const participants = useParticipants();
  
  // Control camera and microphone
  const mediaControls = useMediaControls();
  
  return (
    <div>
      <p>Call Status: {status}</p>
      <p>Participants: {participants.length}</p>
      
      <button onClick={() => mediaControls.toggleCamera()}>
        {mediaControls.local.videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
      </button>
      
      <button onClick={() => mediaControls.toggleMicrophone()}>
        {mediaControls.local.audioEnabled ? 'Mute' : 'Unmute'}
      </button>
      
      {/* Your call interface components here */}
    </div>
  );
}
```

## Complete Example

Here's a complete working example that you can copy and use:

```typescript
import React from 'react';
import { RtcProvider, useCallState, useParticipants, type RtcOptions } from 'vg-x07df';

// 1. SDK Configuration
const sdkOptions: RtcOptions = {
  appId: 'your-app-id',
  signalHost: 'wss://your-signal-server.com',
  authProvider: () => localStorage.getItem('auth-token'),
  logLevel: 'info',
  enableDebug: true,
  log: (level, message, meta) => {
    console.log(`[${level.toUpperCase()}]`, message, meta);
  },
  autoJoin: {
    enabled: true,
    retryOnFailure: true,
    maxRetries: 3,
  },
};

// 2. Main App Component
export function App() {
  return (
    <RtcProvider options={sdkOptions}>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4">
            <h1 className="text-3xl font-bold text-gray-900">
              My Video Call App
            </h1>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 px-4">
          <CallInterface />
        </main>
      </div>
    </RtcProvider>
  );
}

// 3. Call Interface Component (can use any SDK hooks)
function CallInterface() {
  const { status } = useCallState();
  const participants = useParticipants();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Call Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-600">Status:</span>
            <span className="ml-2 font-medium">{status}</span>
          </div>
          <div>
            <span className="text-gray-600">Participants:</span>
            <span className="ml-2 font-medium">{participants.length}</span>
          </div>
        </div>
      </div>
      
      {/* Add your call interface components here */}
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">
          Ready to use SDK hooks! Add participant components, media controls, 
          and other call features here.
        </p>
      </div>
    </div>
  );
}

export default App;
```

## Configuration Options Reference

### Required Options

| Option | Type | Description |
|--------|------|-------------|
| `appId` | `string` | Your application identifier from the CallPad service |
| `signalHost` | `string` | WebSocket URL for your signal server (e.g., `wss://signal.example.com`) |
| `authProvider` | `() => string \| null` | Function that returns your JWT authentication token |

### Optional Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `logLevel` | `'debug' \| 'info' \| 'warn' \| 'error'` | `'warn'` | Minimum log level to output |
| `enableDebug` | `boolean` | `false` | Enable additional debug information |
| `log` | `(level, message, meta?) => void` | `undefined` | Custom logging function |
| `autoJoin` | `AutoJoinConfig` | See below | Auto-join configuration for calls |

### Auto-Join Configuration

```typescript
interface AutoJoinConfig {
  enabled: boolean;        // Enable automatic joining of calls
  retryOnFailure: boolean; // Retry if join fails  
  maxRetries: number;      // Maximum number of retry attempts
}
```

## What's Available After Setup

Once you have the `RtcProvider` set up, you have access to all SDK hooks:

### Core Call Management
- **`useCallState()`** - Monitor call status and information
- **`useCallActions()`** - Control call lifecycle (start, end, accept, decline)
- **`useParticipants()`** - Get list of all participants

### Media Management  
- **`useParticipantMedia(participantId)`** - Get audio/video tracks for a participant
- **`useMediaControls()`** - Control camera, microphone, screen sharing
- **`useDevices()`** - Manage device selection and enumeration

### Audio/Video Handling
- **`useAudioPlayback()`** - Handle browser autoplay restrictions
- **`useCallTypeTracks()`** - Automatic track management based on call type

### Error Handling
- **`useErrorRecovery()`** - Handle connection errors and recovery
- **`useErrors()`** - Access error state and history

## Next Steps

Now that you have the basic setup:

1. **[Learn to display participants](./simple-participant.md)** - Show audio and video with just 3 lines of code
2. **[Handle audio restrictions](./audio-activation.md)** - Manage browser autoplay policies  
3. **[Build advanced UI](./advanced-participant.md)** - Add error handling and loading states
4. **[See complete example](./complete-interface.md)** - Production-ready call interface

The SDK handles all the complex LiveKit integration, browser compatibility, and error recovery - you just focus on your UI! 🚀