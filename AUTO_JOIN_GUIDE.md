# Auto-Join Configuration Guide

The CallPad SDK now supports intelligent auto-join functionality that provides seamless call experiences while maintaining user control and robust error handling.

## Overview

Auto-join automatically connects users to LiveKit media sessions based on configurable triggers, following industry best practices from platforms like Zoom, Teams, and Google Meet.

## Features

### ✅ **Smart Triggers**

- **Caller**: Auto-join when first participant accepts
- **Callee**: Auto-join immediately after accepting call
- **Manual**: Complete user control for all scenarios

### ✅ **Robust Error Handling** 

- **Exponential backoff retry**: 1s → 2s → 4s delays
- **Graceful fallback**: Failed auto-join → manual join button
- **Error categorization**: Network vs authentication failures

### ✅ **Real-time State Tracking**

- Live auto-join status: `idle`, `pending`, `retrying`, `succeeded`, `failed`
- Progress visibility: Current attempt count and error messages
- Performance metrics: Start/completion timestamps

### ✅ **Developer Experience**

- **Type-safe configuration**: Full TypeScript support
- **React hooks**: `useAutoJoin()`, `useAutoJoinForCurrentUser()`
- **Rich logging**: Detailed debug information

## Configuration

### Basic Setup

```typescript
import { buildSdk } from 'vg-x07df'

const sdk = buildSdk({
  appId: 'your-app',
  signalHost: 'wss://your-host',
  authProvider: () => getToken(),
  
  // Auto-join configuration
  autoJoin: {
    caller: {
      enabled: true,
      trigger: 'first-accept'  // Auto-join when first participant accepts
    },
    callee: {
      enabled: true,
      trigger: 'immediate'     // Auto-join immediately after accepting
    },
    fallback: {
      onFailure: 'retry',      // Retry on failure vs 'manual' fallback
      retryAttempts: 3         // Max retry attempts
    }
  }
})
```

### Configuration Options

#### Caller Settings

```typescript
caller: {
  enabled: boolean           // Enable/disable auto-join for callers
  trigger: 'first-accept'    // Join when first participant accepts
         | 'manual'          // Always require manual join
}
```

#### Callee Settings  

```typescript
callee: {
  enabled: boolean           // Enable/disable auto-join for callees
  trigger: 'immediate'       // Join immediately after accepting call
         | 'manual'          // Always require manual join
}
```

#### Fallback Behavior

```typescript
fallback: {
  onFailure: 'retry'         // Retry with exponential backoff
           | 'manual'        // Show manual join button immediately
  retryAttempts: number      // Max retry attempts (1-5)
}
```

## Usage in Components

### Access Configuration

```typescript
import { useAutoJoin, useAutoJoinForCurrentUser } from 'vg-x07df'

function CallSettings() {
  const autoJoin = useAutoJoin()
  const userAutoJoin = useAutoJoinForCurrentUser()
  
  return (
    <div>
      <p>Caller auto-join: {autoJoin.isCallerAutoJoinEnabled ? 'ON' : 'OFF'}</p>
      <p>Your role: {userAutoJoin.shouldAutoJoin ? 'Auto-join enabled' : 'Manual join'}</p>
      <p>Trigger: {userAutoJoin.trigger}</p>
    </div>
  )
}
```

### Monitor Auto-Join Status

```typescript
import { useSdk } from 'vg-x07df'

function AutoJoinStatus() {
  const sdk = useSdk()
  const autoJoinState = sdk.store(state => state.autoJoin)
  
  switch (autoJoinState.status) {
    case 'pending':
      return <div>🔄 Joining automatically...</div>
    case 'retrying':
      return <div>⏳ Retrying... ({autoJoinState.attempt}/{autoJoinState.maxAttempts})</div>
    case 'failed':
      return (
        <div>
          ⚠️ Auto-join failed
          <button onClick={() => sdk.join()}>Join Manually</button>
        </div>
      )
    case 'succeeded':
      return <div>✅ Connected!</div>
    default:
      return null
  }
}
```

### Manual Join Fallback

```typescript
function CallInterface() {
  const { status } = useCallState()
  const sdk = useSdk()
  const userAutoJoin = useAutoJoinForCurrentUser()
  
  const showManualJoinButton = status === 'READY_TO_JOIN' && !userAutoJoin.shouldAutoJoin
  
  return (
    <div>
      {showManualJoinButton && (
        <button 
          onClick={() => sdk.join()}
          className="join-button"
        >
          Join Call
        </button>
      )}
    </div>
  )
}
```

## Session States

The SDK introduces new session states to handle the auto-join flow:

| State | Description | User Action |
|-------|-------------|-------------|
| `IDLE` | No active call | - |
| `CALLING` | Caller initiated call, waiting | - |
| `RINGING` | Incoming call notification | Accept/Decline |
| `ACCEPTED` | Call accepted, getting join info | - |
| `READY_TO_JOIN` | Has join credentials, ready to connect | Auto-join or Manual |
| `CONNECTING` | Joining LiveKit room | - |
| `ACTIVE` | Connected to media session | Media controls |
| `ENDED` | Call completed | - |

## Industry Patterns

### Zoom/Teams Pattern (Default)

```typescript
autoJoin: {
  caller: { enabled: true, trigger: 'first-accept' },
  callee: { enabled: true, trigger: 'immediate' },
  fallback: { onFailure: 'manual', retryAttempts: 2 }
}
```

### Conservative Pattern

```typescript
autoJoin: {
  caller: { enabled: false, trigger: 'manual' },
  callee: { enabled: false, trigger: 'manual' },
  fallback: { onFailure: 'manual', retryAttempts: 1 }
}
```

### Aggressive Retry Pattern

```typescript
autoJoin: {
  caller: { enabled: true, trigger: 'first-accept' },
  callee: { enabled: true, trigger: 'immediate' },
  fallback: { onFailure: 'retry', retryAttempts: 5 }
}
```

## Events

The SDK emits auto-join related events:

```typescript
// Listen for auto-join events
sdk.on('join-info:received', (event) => {
  console.log('Join info received:', event.autoJoined)
})

sdk.on('participant:joined', (event) => {
  console.log('Participant joined:', event.participant.role)
})
```

## Error Handling

### Retry Logic
- **Exponential backoff**: 1s, 2s, 4s, 8s...
- **Network error detection**: Automatic retry for transient failures
- **Auth error handling**: Immediate fallback to manual join

### Error Recovery
```typescript
// Handle auto-join failures
sdk.store.subscribe(state => {
  if (state.autoJoin.status === 'failed') {
    // Show user-friendly error message
    // Provide manual join option
    showNotification('Connection failed. Please join manually.')
  }
})
```

## Performance Considerations

### Resource Optimization
- **Lazy room creation**: Rooms only created when participants join
- **Efficient state updates**: Minimal re-renders during auto-join
- **Memory management**: Automatic cleanup on call end

### Network Resilience
- **Connection quality monitoring**: Adjust retry behavior based on network
- **Bandwidth detection**: Optimize media settings for auto-join
- **Fallback servers**: Multiple LiveKit server support

## Best Practices

### 1. **User Communication**
```typescript
// Always inform users about auto-join status
const AutoJoinFeedback = () => {
  const autoJoinState = useSdk().store(state => state.autoJoin)
  
  return (
    <div className="auto-join-status">
      {autoJoinState.status === 'pending' && '⏳ Connecting automatically...'}
      {autoJoinState.status === 'retrying' && '🔄 Connection retry in progress...'}
      {autoJoinState.status === 'failed' && '⚠️ Please join manually'}
    </div>
  )
}
```

### 2. **Graceful Degradation**
```typescript
// Always provide manual fallback
const CallControls = () => {
  const { status } = useCallState()
  const sdk = useSdk()
  
  return (
    <div>
      {status === 'READY_TO_JOIN' && (
        <button onClick={() => sdk.join()}>
          Join Call
        </button>
      )}
    </div>
  )
}
```

### 3. **Configuration Validation**
```typescript
// Validate configuration at runtime
const validateAutoJoinConfig = (config: AutoJoinConfig) => {
  if (config.fallback.retryAttempts > 5) {
    console.warn('High retry attempts may impact user experience')
  }
  
  if (!config.caller.enabled && !config.callee.enabled) {
    console.warn('All auto-join disabled - consider enabling for better UX')
  }
}
```

## Migration Guide

### From Manual Join Only
```typescript
// Before
const sdk = buildSdk({ 
  /* basic config */ 
})

// After  
const sdk = buildSdk({
  /* basic config */,
  autoJoin: {
    caller: { enabled: true, trigger: 'first-accept' },
    callee: { enabled: true, trigger: 'immediate' },
    fallback: { onFailure: 'manual', retryAttempts: 2 }
  }
})
```

### Update Components
```typescript
// Before
const CallInterface = () => {
  const { status } = useCallState()
  
  return (
    <div>
      {status === 'ACCEPTED' && <JoinButton />}
    </div>
  )
}

// After
const CallInterface = () => {
  const { status } = useCallState()
  const userAutoJoin = useAutoJoinForCurrentUser()
  
  return (
    <div>
      {status === 'READY_TO_JOIN' && !userAutoJoin.shouldAutoJoin && <JoinButton />}
      <AutoJoinStatus />
    </div>
  )
}
```

## Demo Application

The demo app at `examples/demo` showcases all auto-join features:

1. **Settings Panel**: Configure auto-join behavior
2. **Status Indicators**: Real-time auto-join progress
3. **Manual Fallbacks**: Join buttons when auto-join fails
4. **Error Handling**: User-friendly error messages

Run the demo:
```bash
cd examples/demo
pnpm dev --port 3002
```

Visit: http://localhost:3002

## Troubleshooting

### Common Issues

**Auto-join not working**
- Check `autoJoin.enabled` configuration
- Verify LiveKit credentials are valid
- Ensure network connectivity

**Frequent retries**  
- Check LiveKit server status
- Verify token expiration
- Consider reducing `retryAttempts`

**UI not updating**
- Ensure components use `useSdk().store` hook
- Check React re-render optimization
- Verify state subscription setup

### Debug Logging

Enable debug logging for detailed auto-join information:

```typescript
const sdk = buildSdk({
  // ... other config
  logLevel: 'debug',
  enableDebug: true
})
```

Look for log messages prefixed with `[callpad:socketio:call-join-info]` and `[callpad:socketio:call-accepted]`.