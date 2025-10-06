# CallPad SDK Documentation

A production-ready headless SDK for CallPad audio/video calls built on React, LiveKit, and Socket.IO.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [RTC Provider Configuration](#rtc-provider-configuration)
- [Core Concepts](#core-concepts)
- [Call Management](#call-management)
  - [Intercepting Incoming Calls](#intercepting-incoming-calls)
  - [Initiating Calls](#initiating-calls)
  - [Accepting and Declining Calls](#accepting-and-declining-calls)
  - [Managing Call State](#managing-call-state)
- [Hooks Reference](#hooks-reference)
- [Event System](#event-system)
- [Media Controls](#media-controls)
- [Participant Management](#participant-management)
- [Auto-Join Configuration](#auto-join-configuration)
- [Error Handling](#error-handling)
- [TypeScript Support](#typescript-support)
- [Advanced Usage](#advanced-usage)
- [Examples](#examples)

## Installation

Install the SDK using pnpm (recommended):

```bash
pnpm add vg-callpad-x07df
```

Or using npm:

```bash
npm install vg-callpad-x07df
```

### Peer Dependencies

The SDK requires the following peer dependencies:

```bash
pnpm add react@>=18 react-dom@>=18 livekit-client@^2.8.0 socket.io-client@^4.7.0
```

## Quick Start

### 1. Setup the RTC Provider

Wrap your application with the `RtcProvider` to enable CallPad functionality:

```tsx
import React from 'react';
import { RtcProvider } from 'vg-callpad-x07df';

const rtcOptions = {
  appId: 'your-app-id',
  signalHost: 'https://your-signal-server.com',
  authProvider: () => {
    // Return your authentication token
    return localStorage.getItem('auth-token');
  },
  logLevel: 'info',
  enableDebug: false,
};

function App() {
  return (
    <RtcProvider options={rtcOptions}>
      <YourAppComponents />
    </RtcProvider>
  );
}
```

### 2. Use Basic Hooks

```tsx
import { useCallState, useCallActions } from 'vg-callpad-x07df';

function CallComponent() {
  const callState = useCallState();
  const { initiate, accept, decline } = useCallActions();

  const handleInitiateCall = () => {
    initiate(['user-id-1', 'user-id-2'], 'VIDEO');
  };

  return (
    <div>
      <p>Call Status: {callState.status}</p>
      <button onClick={handleInitiateCall}>Start Video Call</button>
    </div>
  );
}
```

## RTC Provider Configuration

The `RtcProvider` accepts an `options` prop with the following configuration:

### Required Options

```tsx
interface RtcOptions {
  appId: string;              // Your application identifier
  signalHost: string;         // Signal server URL
  authProvider: () => string | null;  // Token provider function
}
```

### Optional Configuration

```tsx
interface RtcOptions {
  // Logging configuration
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  enableDebug?: boolean;
  log?: (level: string, message: string, meta?: any) => void;

  // Auto-join configuration
  autoJoin?: Partial<AutoJoinConfig>;
}
```

### Auto-Join Configuration

```tsx
interface AutoJoinConfig {
  enabled: boolean;           // Enable auto-join (default: true)
  retryOnFailure: boolean;    // Retry on connection failure (default: true)
  maxRetries: number;         // Maximum retry attempts (default: 2)
}
```

### Complete Configuration Example

```tsx
const rtcOptions = {
  appId: 'callpad-app',
  signalHost: 'https://signal.example.com',
  authProvider: () => authService.getToken(),
  
  // Logging
  logLevel: 'debug',
  enableDebug: true,
  log: (level, message, meta) => {
    console.log(`[${level.toUpperCase()}] ${message}`, meta);
  },
  
  // Auto-join
  autoJoin: {
    enabled: true,
    retryOnFailure: true,
    maxRetries: 3,
  },
};
```

## Core Concepts

### Session Status

The SDK tracks call sessions through various states:

- `IDLE` - No active call
- `CALLING` - Outgoing call initiated, waiting for response
- `RINGING` - Incoming call received
- `ACCEPTED` - Call accepted but not yet connected to media
- `AWAITING_JOIN_INFO` - Waiting for LiveKit connection details
- `READY_TO_JOIN` - Ready to connect to media session
- `CONNECTING` - Joining LiveKit room
- `ACTIVE` - Successfully connected to media session
- `ENDED` - Call completed

### Participants

Participants represent users in a call with the following properties:

```tsx
interface Participant {
  id: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: "CALLER" | "CALLEE" | "HOST" | "MEMBER";
  callState: "INVITED" | "RINGING" | "JOINED" | "LEFT";
  audioEnabled: boolean;
  videoEnabled: boolean;
  isSpeaking: boolean;
  connectionQuality?: "excellent" | "good" | "poor" | "lost" | "unknown";
  invitedAt?: number;
  joinedAt?: number;
  leftAt?: number;
}
```

## Call Management

### Intercepting Incoming Calls

Use the `useCallState` hook to detect incoming calls:

```tsx
import { useCallState, useCallActions } from 'vg-callpad-x07df';

function IncomingCallHandler() {
  const { incomingCall, status } = useCallState();
  const { accept, decline } = useCallActions();

  if (status === 'RINGING' && incomingCall) {
    return (
      <div className="incoming-call-modal">
        <h3>Incoming {incomingCall.type} call</h3>
        <p>From: {incomingCall.caller.name}</p>
        
        <button onClick={() => accept(incomingCall.callId)}>
          Accept
        </button>
        <button onClick={() => decline(incomingCall.callId)}>
          Decline
        </button>
      </div>
    );
  }

  return null;
}
```

### Advanced Incoming Call Handling

Use event hooks for more sophisticated incoming call management:

```tsx
import { useEvent, SdkEventType } from 'vg-callpad-x07df';

function AdvancedIncomingCallHandler() {
  useEvent(SdkEventType.CALL_INCOMING, (event) => {
    const { callId, caller, type } = event.payload;
    
    // Show custom notification
    showNotification({
      title: `Incoming ${type} call`,
      body: `${caller.firstName} ${caller.lastName} is calling`,
      actions: [
        { action: 'accept', title: 'Accept' },
        { action: 'decline', title: 'Decline' }
      ]
    });
  });

  return <div>Listening for incoming calls...</div>;
}
```

### Initiating Calls

Use the `useCallActions` hook to start calls:

```tsx
function CallInitiator() {
  const { initiate } = useCallActions();
  const [participants, setParticipants] = useState(['']);

  const handleVideoCall = async () => {
    try {
      const response = await initiate(participants, 'VIDEO');
      console.log('Call initiated:', response);
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }
  };

  const handleAudioCall = async () => {
    try {
      const response = await initiate(participants, 'AUDIO');
      console.log('Call initiated:', response);
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }
  };

  return (
    <div>
      <input 
        value={participants[0]} 
        onChange={(e) => setParticipants([e.target.value])}
        placeholder="User ID to call"
      />
      <button onClick={handleVideoCall}>Video Call</button>
      <button onClick={handleAudioCall}>Audio Call</button>
    </div>
  );
}
```

### Accepting and Declining Calls

```tsx
function CallResponseHandler() {
  const { accept, decline } = useCallActions();
  const { incomingCall } = useCallState();

  const handleAccept = async () => {
    if (incomingCall) {
      try {
        await accept(incomingCall.callId);
      } catch (error) {
        console.error('Failed to accept call:', error);
      }
    }
  };

  const handleDecline = async () => {
    if (incomingCall) {
      try {
        await decline(incomingCall.callId);
      } catch (error) {
        console.error('Failed to decline call:', error);
      }
    }
  };

  return (
    <div>
      <button onClick={handleAccept}>Accept Call</button>
      <button onClick={handleDecline}>Decline Call</button>
    </div>
  );
}
```

### Managing Call State

Monitor and respond to call state changes:

```tsx
function CallStateManager() {
  const callState = useCallState();

  useEffect(() => {
    switch (callState.status) {
      case 'CALLING':
        console.log('Outgoing call initiated');
        break;
      case 'RINGING':
        console.log('Incoming call received');
        break;
      case 'ACTIVE':
        console.log('Call is now active');
        break;
      case 'ENDED':
        console.log('Call has ended');
        break;
    }
  }, [callState.status]);

  return (
    <div>
      <h3>Call Information</h3>
      <p>Status: {callState.status}</p>
      <p>Mode: {callState.mode || 'None'}</p>
      <p>Room: {callState.roomName || 'None'}</p>
      {callState.id && <p>Call ID: {callState.id}</p>}
    </div>
  );
}
```

## Hooks Reference

### Call Management Hooks

#### `useCallState()`

Returns current call state information:

```tsx
interface CallState {
  id: string | undefined;
  status: SessionStatus;
  mode: "AUDIO" | "VIDEO" | undefined;
  roomName: string | undefined;
  incomingCall: IncomingCallInfo | undefined;
}

const callState = useCallState();
```

#### `useCallActions()`

Provides call action functions:

```tsx
interface CallActions {
  initiate: (participants: string[], type: "AUDIO" | "VIDEO") => Promise<CallResponse>;
  accept: (callId: string) => Promise<CallActionResponse>;
  decline: (callId: string) => Promise<CallActionResponse>;
  end: (callId: string) => Promise<CallActionResponse>;
  cancel: (callId: string) => Promise<CallActionResponse>;
  join: () => Promise<void>;
}

const actions = useCallActions();
```

#### `useCallQuality()`

Monitor call quality metrics:

```tsx
const quality = useCallQuality();
// Returns quality information and metrics
```

### Media Control Hooks

#### `useMediaControls()`

Comprehensive media control interface:

```tsx
const {
  // State
  isVideoEnabled,
  isAudioEnabled,
  isCameraAvailable,
  isMicrophoneAvailable,
  isConnected,
  isLoading,
  errors,
  devices,

  // Actions
  enableCamera,
  disableCamera,
  enableMicrophone,
  disableMicrophone,
  toggleCamera,
  toggleMicrophone,
  toggleAudio,
  toggleVideo,
  switchCamera,
  switchMicrophone
} = useMediaControls();
```

#### `useDevices()`

Access and manage media devices:

```tsx
const devices = useDevices();
// Returns cameras, microphones, speakers, and permissions
```

### Event System Hooks

#### `useEvent(eventType, callback?, filter?)`

Subscribe to specific SDK events:

```tsx
// Listen for specific event
const callEvent = useEvent(SdkEventType.CALL_ACCEPTED);

// Listen with callback
useEvent(SdkEventType.MEDIA_ENABLED, (event) => {
  console.log('Media enabled:', event.payload);
});

// Listen with filter
useEvent('call:*', null, (event) => 
  event.payload.callId === 'specific-call'
);
```

#### `useCallEvents(callId?)`

Subscribe to call-specific events:

```tsx
const {
  callAccepted,
  callDeclined,
  callEnded,
  participantJoined,
  participantLeft
} = useCallEvents(callId);
```

#### `useMediaEvents(participantId?)`

Subscribe to media events for a specific participant:

```tsx
const { mediaEnabled, mediaDisabled } = useMediaEvents(participantId);
```

### Participant Hooks

#### `useParticipants()`

Get all call participants:

```tsx
const participants = useParticipants();
// Returns array of Participant objects
```

#### `useParticipantStatus(participantId)`

Get status for a specific participant:

```tsx
const status = useParticipantStatus('user-123');
```

### Auto-Join Hooks

#### `useAutoJoin()`

Access auto-join configuration:

```tsx
const {
  config,
  isEnabled,
  retryOnFailure,
  maxRetries
} = useAutoJoin();
```

### Error Handling Hooks

#### `useErrorRecovery()`

Access error recovery functionality:

```tsx
const recovery = useErrorRecovery();
```

#### `useErrors()`

Get current error state:

```tsx
const errors = useErrors();
const connectionErrors = useErrorsByCode('CONNECTION_');
const errorCount = useErrorCount();
```

## Event System

The SDK provides a comprehensive event system for real-time communication updates.

### Event Types

```tsx
enum SdkEventType {
  // Call lifecycle
  CALL_INITIATED = "call:initiated",
  CALL_INCOMING = "call:incoming",
  CALL_ACCEPTED = "call:accepted",
  CALL_DECLINED = "call:declined",
  CALL_ENDED = "call:ended",
  CALL_CANCELED = "call:canceled",
  CALL_TIMEOUT = "call:timeout",

  // Participants
  PARTICIPANT_JOINED = "participant:joined",
  PARTICIPANT_LEFT = "participant:left",

  // Media
  MEDIA_ENABLED = "media:enabled",
  MEDIA_DISABLED = "media:disabled",

  // Connection
  CONNECTION_ESTABLISHED = "connection:established",
  CONNECTION_LOST = "connection:lost",
  CONNECTION_QUALITY_CHANGED = "connection:quality-changed",

  // Errors
  ERROR_OCCURRED = "error:occurred",
}
```

### Event Usage Examples

```tsx
// Single event listener
useEvent(SdkEventType.CALL_ACCEPTED, (event) => {
  console.log('Call accepted:', event.payload);
});

// Pattern matching
useEvent('call:*', (event) => {
  console.log('Any call event:', event.type, event.payload);
});

// Event with filter
useEvent(
  SdkEventType.PARTICIPANT_JOINED, 
  (event) => {
    console.log('New participant:', event.payload.participant);
  },
  (event) => event.payload.callId === currentCallId
);

// One-time event listener
useEventOnce(SdkEventType.CALL_ENDED, (event) => {
  console.log('Call ended, cleaning up...');
});
```

### Direct Event Bus Access

```tsx
const eventBus = useEventBus();

// Emit custom event
eventBus.emit('custom:event', { data: 'test' });

// Get event history
const history = eventBus.getEventHistory();

// Get filtered events
const callEvents = eventBus.getEventsWhere(
  (event) => event.type.startsWith('call:')
);
```

## Media Controls

### Basic Media Controls

```tsx
function MediaControlPanel() {
  const {
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    devices
  } = useMediaControls();

  return (
    <div>
      <button 
        onClick={toggleVideo}
        className={isVideoEnabled ? 'enabled' : 'disabled'}
      >
        {isVideoEnabled ? 'Disable Video' : 'Enable Video'}
      </button>
      
      <button 
        onClick={toggleAudio}
        className={isAudioEnabled ? 'enabled' : 'disabled'}
      >
        {isAudioEnabled ? 'Disable Audio' : 'Enable Audio'}
      </button>
    </div>
  );
}
```

### Device Management

```tsx
function DeviceSelector() {
  const { devices, switchCamera, switchMicrophone } = useMediaControls();

  return (
    <div>
      <select onChange={(e) => switchCamera(e.target.value)}>
        <option value="">Select Camera</option>
        {devices.cameras.map(camera => (
          <option key={camera.deviceId} value={camera.deviceId}>
            {camera.label}
          </option>
        ))}
      </select>

      <select onChange={(e) => switchMicrophone(e.target.value)}>
        <option value="">Select Microphone</option>
        {devices.microphones.map(mic => (
          <option key={mic.deviceId} value={mic.deviceId}>
            {mic.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Advanced Media Controls

```tsx
function AdvancedMediaControls() {
  const {
    enableCamera,
    disableCamera,
    enableMicrophone,
    disableMicrophone,
    isLoading,
    errors
  } = useMediaControls();

  const handleCameraToggle = async () => {
    try {
      if (isVideoEnabled) {
        await disableCamera();
      } else {
        await enableCamera();
      }
    } catch (error) {
      console.error('Camera control failed:', error);
    }
  };

  if (errors.length > 0) {
    return (
      <div className="media-errors">
        {errors.map(error => (
          <p key={error.code}>{error.message}</p>
        ))}
      </div>
    );
  }

  return (
    <div>
      <button onClick={handleCameraToggle} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Toggle Camera'}
      </button>
    </div>
  );
}
```

## Participant Management

### Displaying Participants

```tsx
function ParticipantList() {
  const participants = useParticipants();

  return (
    <div className="participants">
      {participants.map(participant => (
        <div key={participant.id} className="participant">
          <img src={participant.avatarUrl} alt={participant.firstName} />
          <span>{participant.firstName} {participant.lastName}</span>
          <span className={`status ${participant.callState.toLowerCase()}`}>
            {participant.callState}
          </span>
          <div className="media-status">
            {participant.audioEnabled && <span>🎤</span>}
            {participant.videoEnabled && <span>📹</span>}
            {participant.isSpeaking && <span>🔊</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Participant Status Monitoring

```tsx
function ParticipantMonitor({ participantId }) {
  const status = useParticipantStatus(participantId);
  const { mediaEnabled, mediaDisabled } = useMediaEvents(participantId);

  useEffect(() => {
    if (mediaEnabled) {
      console.log(`${participantId} enabled ${mediaEnabled.payload.mediaType}`);
    }
  }, [mediaEnabled, participantId]);

  useEffect(() => {
    if (mediaDisabled) {
      console.log(`${participantId} disabled ${mediaDisabled.payload.mediaType}`);
    }
  }, [mediaDisabled, participantId]);

  return (
    <div>
      <h4>Participant: {participantId}</h4>
      <p>Connection: {status?.connectionQuality}</p>
      <p>Speaking: {status?.isSpeaking ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## Auto-Join Configuration

### Using Auto-Join

```tsx
function AutoJoinExample() {
  const autoJoin = useAutoJoin();
  const { shouldAutoJoin, reason } = useAutoJoinForCurrentUser();

  return (
    <div>
      <h3>Auto-Join Status</h3>
      <p>Enabled: {autoJoin.isEnabled ? 'Yes' : 'No'}</p>
      <p>Max Retries: {autoJoin.maxRetries}</p>
      <p>Should Auto-Join: {shouldAutoJoin ? 'Yes' : 'No'}</p>
      <p>Reason: {reason}</p>
    </div>
  );
}
```

## Error Handling

### Error Recovery

```tsx
function ErrorRecoveryExample() {
  const recovery = useErrorRecovery();
  const errors = useErrors();

  const handleRecovery = async () => {
    try {
      await recovery.attemptRecovery();
    } catch (error) {
      console.error('Recovery failed:', error);
    }
  };

  if (errors.length > 0) {
    return (
      <div className="error-panel">
        <h3>Errors Detected</h3>
        {errors.map(error => (
          <div key={error.code} className="error">
            <strong>{error.code}</strong>: {error.message}
          </div>
        ))}
        <button onClick={handleRecovery}>Attempt Recovery</button>
      </div>
    );
  }

  return null;
}
```

### Custom Error Handling

```tsx
function CustomErrorHandler() {
  useEvent(SdkEventType.ERROR_OCCURRED, (event) => {
    const { code, message, source } = event.payload;
    
    // Custom error handling logic
    switch (code) {
      case 'CONNECTION_LOST':
        showReconnectingNotification();
        break;
      case 'MEDIA_PERMISSION_DENIED':
        showPermissionRequestDialog();
        break;
      default:
        showGenericErrorToast(message);
    }
  });

  return <div>Error handler active</div>;
}
```

## TypeScript Support

The SDK is built with full TypeScript support. All hooks, components, and utilities are fully typed.

### Type Definitions

```tsx
import type {
  // Core types
  SessionStatus,
  Participant,
  IncomingCallInfo,
  RtcError,
  
  // Config types
  RtcOptions,
  AutoJoinConfig,
  
  // Event types
  SdkEvent,
  SdkEventType,
  CallAcceptedEvent,
  
  // API types
  InitiateCallParams,
  CallResponse,
  CallActionResponse,
} from 'vg-callpad-x07df';
```

### Custom Hook Example

```tsx
import { useCallState, useCallActions } from 'vg-callpad-x07df';
import type { SessionStatus } from 'vg-callpad-x07df';

function useCallManager() {
  const callState = useCallState();
  const actions = useCallActions();

  const isCallActive = (): boolean => {
    return callState.status === 'ACTIVE';
  };

  const canInitiateCall = (): boolean => {
    return callState.status === 'IDLE';
  };

  return {
    ...callState,
    ...actions,
    isCallActive,
    canInitiateCall,
  };
}
```

## Advanced Usage

### Direct SDK Access

Access the SDK instance directly for advanced operations:

```tsx
import { useSdk } from 'vg-callpad-x07df';

function AdvancedComponent() {
  const sdk = useSdk();

  const performAdvancedOperation = async () => {
    // Direct access to SDK components
    const authToken = sdk.auth.getCurrentToken();
    await sdk.signal.customApiCall();
    sdk.livekit.performAdvancedMediaOperation();
  };

  return <button onClick={performAdvancedOperation}>Advanced Op</button>;
}
```

### Custom Logging

```tsx
const rtcOptions = {
  appId: 'my-app',
  signalHost: 'https://signal.example.com',
  authProvider: () => getToken(),
  
  // Custom logging
  log: (level, message, meta) => {
    // Send to your logging service
    analyticsService.log({
      level,
      message,
      meta,
      timestamp: Date.now(),
      userId: getCurrentUserId(),
    });
  },
};
```

### State Management Integration

```tsx
// Redux integration example
function useCallStateSync() {
  const callState = useCallState();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(updateCallState(callState));
  }, [callState, dispatch]);
}
```

## Examples

### Complete Call Application

```tsx
import React from 'react';
import {
  RtcProvider,
  useCallState,
  useCallActions,
  useMediaControls,
  useParticipants,
  useEvent,
  SdkEventType
} from 'vg-callpad-x07df';

// Main app with provider
function App() {
  const rtcOptions = {
    appId: 'demo-app',
    signalHost: 'https://your-signal-server.com',
    authProvider: () => localStorage.getItem('token'),
    logLevel: 'info',
    autoJoin: { enabled: true, maxRetries: 2 }
  };

  return (
    <RtcProvider options={rtcOptions}>
      <CallApp />
    </RtcProvider>
  );
}

// Call application component
function CallApp() {
  const callState = useCallState();
  const { initiate, accept, decline, end } = useCallActions();
  const { toggleVideo, toggleAudio, isVideoEnabled, isAudioEnabled } = useMediaControls();
  const participants = useParticipants();

  // Handle incoming calls
  useEvent(SdkEventType.CALL_INCOMING, (event) => {
    const { caller, type } = event.payload;
    const response = confirm(`Accept ${type} call from ${caller.firstName}?`);
    if (response) {
      accept(event.payload.callId);
    } else {
      decline(event.payload.callId);
    }
  });

  const startVideoCall = () => {
    initiate(['user-123'], 'VIDEO');
  };

  const endCall = () => {
    if (callState.id) {
      end(callState.id);
    }
  };

  return (
    <div>
      <h1>CallPad Demo</h1>
      
      <div>Status: {callState.status}</div>
      
      {callState.status === 'IDLE' && (
        <button onClick={startVideoCall}>Start Video Call</button>
      )}
      
      {callState.status === 'ACTIVE' && (
        <div>
          <button onClick={toggleVideo}>
            {isVideoEnabled ? 'Disable Video' : 'Enable Video'}
          </button>
          <button onClick={toggleAudio}>
            {isAudioEnabled ? 'Mute' : 'Unmute'}
          </button>
          <button onClick={endCall}>End Call</button>
          
          <div>
            <h3>Participants ({participants.length})</h3>
            {participants.map(p => (
              <div key={p.id}>
                {p.firstName} {p.lastName} - {p.callState}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
```

### Notification Service Integration

```tsx
function NotificationService() {
  useEvent(SdkEventType.CALL_INCOMING, (event) => {
    const { callId, caller, type } = event.payload;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(
        `Incoming ${type} Call`,
        {
          body: `${caller.firstName} ${caller.lastName} is calling`,
          icon: caller.avatarUrl,
          actions: [
            { action: 'accept', title: 'Accept' },
            { action: 'decline', title: 'Decline' }
          ]
        }
      );
      
      notification.onclick = (event) => {
        if (event.action === 'accept') {
          acceptCall(callId);
        } else if (event.action === 'decline') {
          declineCall(callId);
        }
      };
    }
  });

  return null;
}
```

This comprehensive documentation covers all major aspects of the CallPad SDK, providing developers with the information needed to integrate audio/video calling functionality into their React applications.