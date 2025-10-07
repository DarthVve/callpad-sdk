# AudioTrack Component Usage Guide

## Overview

The `AudioTrack` component is a React component that simplifies audio track rendering for participants in LiveKit-based video calls. It handles all the complexity of audio track attachment, volume control, and cleanup automatically.

## Installation

The AudioTrack component is included in the SDK:

```typescript
import { AudioTrack } from 'vg-x07df';
```

## Basic Usage

### 1. Simple Audio Rendering

The simplest way to use the AudioTrack component is with a participant ID:

```tsx
<AudioTrack participantId="user123" />
```

This will:
- Fetch the participant's microphone track
- Attach it to an audio element
- Handle all cleanup on unmount
- **Automatically skip local tracks to prevent feedback**

### 2. With Volume Control

Control the audio volume (0.0 to 1.0):

```tsx
<AudioTrack 
  participantId="user123"
  volume={0.5}  // 50% volume
/>
```

### 3. With Mute Control

Mute/unmute the audio:

```tsx
const [isMuted, setIsMuted] = useState(false);

<AudioTrack 
  participantId="user123"
  muted={isMuted}
/>
```

### 4. With Subscription Callbacks

Get notified when subscription status changes:

```tsx
<AudioTrack 
  participantId="user123"
  onSubscriptionStatusChanged={(subscribed) => {
    console.log('Audio track subscribed:', subscribed);
  }}
/>
```

## Advanced Usage

### Using with TrackReference

If you already have a track reference, you can use it directly:

```tsx
import { useParticipantTracks } from 'vg-x07df';
import { Track } from 'livekit-client';

function MyComponent({ participantId }) {
  const trackRefs = useParticipantTracks(participantId, [Track.Source.Microphone]);
  const audioTrackRef = trackRefs[0];
  
  return (
    <AudioTrack 
      trackRef={audioTrackRef}
      volume={0.8}
    />
  );
}
```

### Complete Example with UI Controls

```tsx
import { useState } from 'react';
import { AudioTrack, useParticipants } from 'vg-x07df';

function ParticipantAudio({ participant }) {
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  
  return (
    <div className="participant">
      <AudioTrack 
        participantId={participant.id}
        volume={volume}
        muted={isMuted}
        onSubscriptionStatusChanged={(subscribed) => {
          console.log(`${participant.name} audio:`, subscribed);
        }}
      />
      
      <div className="audio-controls">
        <label>
          Volume: 
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={volume * 100}
            onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
          />
        </label>
        
        <button onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>
    </div>
  );
}
```

## Important Notes

### Local Audio Feedback Prevention

The AudioTrack component **automatically prevents local audio feedback** by not rendering audio for local participants. You don't need to check for `isLocal` manually:

```tsx
// ✅ Correct - Component handles local check internally
<AudioTrack participantId={participant.id} />

// ❌ Unnecessary - Component already does this
{!isLocal && <AudioTrack participantId={participant.id} />}
```

### Hidden Audio Elements

The component renders hidden audio elements that are attached to the document body. These elements are:
- Completely hidden (`display: none`)
- Positioned absolutely to not affect layout
- Automatically cleaned up on unmount

### Error Handling

The component includes built-in error handling and logging:
- Audio playback errors are logged with participant context
- Failed attachments are handled gracefully
- Cleanup always runs even if errors occur

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `participantId` | `string` | - | ID of the participant whose audio to render |
| `trackRef` | `TrackReference` | - | Alternative to participantId - provide track directly |
| `volume` | `number` | `1.0` | Audio volume (0.0 to 1.0) |
| `muted` | `boolean` | `false` | Whether to mute the audio |
| `onSubscriptionStatusChanged` | `(subscribed: boolean) => void` | - | Callback for subscription changes |

## Migration from Manual Audio Handling

### Before (Manual Approach)

```tsx
const audioRef = useRef();

useEffect(() => {
  if (!audioTrack || isLocal) return;
  
  const audioElement = audioTrack.attach();
  audioElement.autoplay = true;
  audioElement.volume = 1.0;
  // ... more setup
  audioRef.current.appendChild(audioElement);
  
  return () => {
    audioTrack.detach(audioElement);
  };
}, [audioTrack, isLocal]);

return <div ref={audioRef} style={{ display: 'none' }} />;
```

### After (Using AudioTrack Component)

```tsx
return <AudioTrack participantId={participant.id} />;
```

## Best Practices

1. **Use participant ID when possible** - It's the simplest approach
2. **Control volume at the participant level** - Each participant can have their own volume
3. **Use subscription callbacks for UI updates** - Update UI indicators based on subscription status
4. **Let the component handle local tracks** - Don't manually check for local participants

## Troubleshooting

### No Audio Playing

1. Check browser console for error logs
2. Verify participant has audio track published
3. Check if browser autoplay policies are blocking audio
4. Ensure LiveKit room is connected

### Volume Not Working

1. Verify volume value is between 0.0 and 1.0
2. Check if `muted` prop is not set to `true`
3. Ensure the track is not muted at the source

### Memory Leaks

The component automatically handles cleanup, but ensure:
1. Parent components properly unmount
2. No duplicate AudioTrack components for same participant
3. Track references are properly managed if using `trackRef` prop