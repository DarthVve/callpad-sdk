# Simple Participant Component - Audio/Video Track Attachment

This guide shows the **simplest way** to display a participant's audio and video using the VG CallPad SDK. With just **3 hooks and a few lines of code**, you can have fully working audio/video display with proper LiveKit integration.

## Overview

The SDK makes audio/video track management incredibly simple:

1. **`useParticipantMedia(participantId)`** - Get the participant's tracks
2. **`track.attach()`** - Create and attach HTML elements (LiveKit's recommended way)
3. **`track.detach()`** - Clean up when component unmounts

**No manual HTMLAudioElement or HTMLVideoElement creation needed!** The SDK provides LiveKit track objects that handle everything automatically.

## Basic Implementation

Here's the complete implementation for a simple participant display:

```typescript
import React, { useRef, useEffect } from 'react';
import { useParticipantMedia, type Participant } from 'vg-x07df';

interface SimpleParticipantProps {
  participant: Participant;
  isLocal?: boolean;
}

export function SimpleParticipant({ participant, isLocal = false }: SimpleParticipantProps) {
  // 1. Get the participant's media tracks using the SDK hook
  const { camera, microphone, hasCamera, hasMicrophone } = useParticipantMedia(participant.id);
  
  // 2. Create container refs for the tracks
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);

  // 3. Attach video track using LiveKit's recommended approach
  useEffect(() => {
    if (!videoContainerRef.current || !camera) return;

    // SDK provides LiveKit track objects - use track.attach()
    const videoElement = camera.attach() as HTMLVideoElement;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.muted = isLocal; // Prevent feedback for local video
    videoElement.className = 'w-full h-full object-cover';

    videoContainerRef.current.appendChild(videoElement);

    // Cleanup on unmount or track change
    return () => {
      camera.detach(videoElement);
    };
  }, [camera, isLocal]);

  // 4. Attach audio track (for remote participants only)
  useEffect(() => {
    if (!audioContainerRef.current || !microphone || isLocal) return;

    // SDK provides LiveKit track objects - use track.attach()  
    const audioElement = microphone.attach() as HTMLAudioElement;
    audioElement.autoplay = true;
    audioElement.style.display = 'none'; // Hidden but functional

    audioContainerRef.current.appendChild(audioElement);

    // Cleanup on unmount or track change
    return () => {
      microphone.detach(audioElement);
    };
  }, [microphone, isLocal]);

  // 5. Simple display name
  const displayName = participant.info?.firstName || `User ${participant.id}`;

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
      {/* Hidden audio container */}
      <div ref={audioContainerRef} style={{ display: 'none' }} />
      
      {/* Video display */}
      <div className="aspect-video relative">
        {hasCamera ? (
          <div ref={videoContainerRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-white text-xl font-semibold bg-blue-500 rounded-full w-16 h-16 flex items-center justify-center">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        
        {/* Simple overlay with name and indicators */}
        <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
          {displayName}{isLocal && ' (You)'}
          {!hasMicrophone && ' 🔇'}
        </div>
      </div>
    </div>
  );
}
```

## Usage Example

Here's how to use the `SimpleParticipant` component in a call interface:

```typescript
import React from 'react';
import { useParticipants } from 'vg-x07df';
import { SimpleParticipant } from './SimpleParticipant';

export function SimpleCallView() {
  const participants = useParticipants();

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Call Participants</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {participants.map((participant) => (
          <SimpleParticipant
            key={participant.id}
            participant={participant}
            isLocal={participant.role === 'CALLER'} // Adjust based on your logic
          />
        ))}
      </div>
      
      {participants.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No participants in the call yet
        </div>
      )}
    </div>
  );
}
```

## How It Works

### 1. useParticipantMedia Hook

The `useParticipantMedia` hook is the key to the SDK's simplicity:

```typescript
const { camera, microphone, hasCamera, hasMicrophone } = useParticipantMedia(participant.id);
```

**What you get:**
- **`camera`** - LiveKit track object for video (undefined if no video)
- **`microphone`** - LiveKit track object for audio (undefined if no audio)  
- **`hasCamera`** - Boolean indicating if video is available and not muted
- **`hasMicrophone`** - Boolean indicating if audio is available and not muted

**What the SDK handles:**
- ✅ Track subscription and unsubscription
- ✅ Mute/unmute state changes
- ✅ Network quality adaptation
- ✅ Automatic updates when tracks change

### 2. LiveKit track.attach()

The SDK provides proper LiveKit track objects, so you use the official `track.attach()` method:

```typescript
const videoElement = camera.attach() as HTMLVideoElement;
```

**Benefits of track.attach():**
- ✅ **Adaptive Streaming** - Required for LiveKit's optimization features
- ✅ **Quality Management** - Automatic bandwidth and quality optimization  
- ✅ **Element Creation** - Creates HTMLVideoElement or HTMLAudioElement automatically
- ✅ **Browser Compatibility** - Handles autoplay restrictions and browser quirks

### 3. Proper Cleanup with track.detach()

Always clean up tracks when components unmount or tracks change:

```typescript
return () => {
  camera.detach(videoElement);
};
```

**Why this matters:**
- ✅ **Memory Management** - Prevents memory leaks
- ✅ **Resource Cleanup** - Releases media streams properly
- ✅ **Performance** - Avoids unnecessary processing for hidden elements

## Key Features

### Automatic Audio Handling
```typescript
// Audio elements are created but hidden
audioElement.style.display = 'none';

// Only for remote participants (prevents feedback)
if (!isLocal) {
  const audioElement = microphone.attach();
  // Audio plays automatically
}
```

### Video Fallback UI
```typescript
{hasCamera ? (
  <div ref={videoContainerRef} className="w-full h-full" />
) : (
  <div className="avatar-fallback">
    {displayName.charAt(0).toUpperCase()}
  </div>
)}
```

### Local vs Remote Handling
```typescript
// Mute local video to prevent feedback
videoElement.muted = isLocal;

// Only attach audio for remote participants
if (!isLocal && microphone) {
  // Audio attachment logic
}
```

## Styling with CSS

The component uses CSS classes for easy styling:

```css
/* Video container styling */
.aspect-video {
  aspect-ratio: 16 / 9;
}

/* Participant video element */
.participant-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
}

/* Avatar fallback */
.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  background-color: #3b82f6;
  border-radius: 50%;
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
}

/* Name overlay */
.participant-overlay {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}
```

## Why This Approach Works

### ✅ **LiveKit Best Practices**
- Uses official `track.attach()` and `track.detach()` methods
- Enables adaptive streaming and quality optimization
- Proper resource management and cleanup

### ✅ **React Best Practices**  
- Uses `useEffect` with proper dependencies
- Handles cleanup in return function
- Refs for DOM manipulation

### ✅ **Browser Compatibility**
- Handles autoplay restrictions automatically
- Works with mobile Safari, Chrome, Firefox
- Proper audio/video element configuration

### ✅ **Performance Optimized**
- Only creates elements when tracks are available
- Automatic cleanup prevents memory leaks
- Leverages LiveKit's adaptive streaming

## Common Patterns

### Single Participant View
```typescript
function SingleParticipantView({ participantId }: { participantId: string }) {
  const participants = useParticipants();
  const participant = participants.find(p => p.id === participantId);
  
  if (!participant) return <div>Participant not found</div>;
  
  return (
    <div className="w-full h-full">
      <SimpleParticipant participant={participant} />
    </div>
  );
}
```

### Grid Layout  
```typescript
function ParticipantGrid() {
  const participants = useParticipants();
  
  const gridCols = participants.length === 1 ? 'grid-cols-1' :
                   participants.length === 2 ? 'grid-cols-2' :
                   participants.length <= 4 ? 'grid-cols-2 grid-rows-2' :
                   'grid-cols-3';
  
  return (
    <div className={`grid gap-4 h-full ${gridCols}`}>
      {participants.map((participant) => (
        <SimpleParticipant key={participant.id} participant={participant} />
      ))}
    </div>
  );
}
```

### Local Participant Detection
```typescript
function CallInterface() {
  const participants = useParticipants();
  const { session } = useCallState();
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {participants.map((participant) => (
        <SimpleParticipant
          key={participant.id}
          participant={participant}
          isLocal={participant.id === session.myParticipantId} // Your logic here
        />
      ))}
    </div>
  );
}
```

## Next Steps

This simple approach works great for basic use cases. When you're ready for more features:

- **[Advanced Participant](./advanced-participant.md)** - Add error handling, loading states, and status indicators
- **[Audio Activation](./audio-activation.md)** - Handle browser autoplay restrictions  
- **[Complete Interface](./complete-interface.md)** - Full production-ready call interface

The beauty of the SDK is that you can start simple and add complexity as needed - the core `useParticipantMedia()` + `track.attach()` pattern remains the same! 🎉