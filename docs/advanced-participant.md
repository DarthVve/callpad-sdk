# Advanced Participant Component - Production-Ready Implementation

This guide shows how to build a **production-ready participant component** with comprehensive error handling, loading states, network quality indicators, and robust fallback mechanisms. This is what you'd use in a real application where reliability and user experience matter.

## Overview

Building on the [simple participant](./simple-participant.md) approach, this advanced implementation adds:

- **🔄 Loading States** - Show spinners while tracks are loading
- **⚠️ Error Handling** - Graceful recovery from network/media issues  
- **📊 Status Indicators** - Network quality, speaking detection, connection state
- **🔁 Retry Logic** - Automatic retries for failed track attachments
- **🎨 Rich UI** - Professional appearance with proper visual feedback

## Complete Implementation

```typescript
import React, { useRef, useEffect, useState } from 'react';
import { 
  useParticipantMedia, 
  useParticipantStatus,
  type Participant 
} from 'vg-x07df';

interface AdvancedParticipantProps {
  participant: Participant;
  isLocal?: boolean;
  className?: string;
  onError?: (error: Error) => void;
}

interface TrackState {
  video: {
    loading: boolean;
    error: string | null;
    ready: boolean;
  };
  audio: {
    loading: boolean;
    error: string | null;
    ready: boolean;
  };
}

export function AdvancedParticipant({ 
  participant, 
  isLocal = false, 
  className = '',
  onError 
}: AdvancedParticipantProps) {
  // SDK hooks for media and status
  const { camera, microphone, hasCamera, hasMicrophone } = useParticipantMedia(participant.id);
  const participantStatus = useParticipantStatus(participant.id);
  
  // Track state management
  const [trackState, setTrackState] = useState<TrackState>({
    video: { loading: false, error: null, ready: false },
    audio: { loading: false, error: null, ready: false }
  });
  
  // Container refs
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);

  // Advanced video track handling with error recovery
  useEffect(() => {
    if (!videoContainerRef.current || !camera) return;

    let videoElement: HTMLVideoElement | null = null;
    let retryCount = 0;
    const maxRetries = 3;

    const attachVideo = async () => {
      try {
        setTrackState(prev => ({
          ...prev,
          video: { ...prev.video, loading: true, error: null }
        }));

        videoElement = camera.attach() as HTMLVideoElement;
        
        // Enhanced video configuration
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.muted = isLocal;
        videoElement.controls = false;
        videoElement.disablePictureInPicture = true;
        videoElement.className = 'w-full h-full object-cover';

        // Enhanced event handling
        const handleVideoError = async (event: Event) => {
          const error = new Error(`Video playback error for ${participant.id}`);
          console.warn('Video error:', event, { participant: participant.id, retryCount });
          
          setTrackState(prev => ({
            ...prev,
            video: { ...prev.video, error: error.message, loading: false }
          }));
          
          // Retry logic
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(() => attachVideo(), 1000 * retryCount);
          } else {
            onError?.(error);
          }
        };

        const handleVideoCanPlay = () => {
          setTrackState(prev => ({
            ...prev,
            video: { loading: false, error: null, ready: true }
          }));
          console.debug(`Video ready for ${participant.id}`);
        };

        const handleVideoLoadStart = () => {
          setTrackState(prev => ({
            ...prev,
            video: { ...prev.video, loading: true }
          }));
        };

        const handleVideoLoadedMetadata = () => {
          console.debug(`Video metadata loaded for ${participant.id}`, {
            width: videoElement?.videoWidth,
            height: videoElement?.videoHeight
          });
        };

        // Add event listeners
        videoElement.addEventListener('error', handleVideoError);
        videoElement.addEventListener('canplay', handleVideoCanPlay);
        videoElement.addEventListener('loadstart', handleVideoLoadStart);
        videoElement.addEventListener('loadedmetadata', handleVideoLoadedMetadata);

        videoContainerRef.current?.appendChild(videoElement);

      } catch (error) {
        const trackError = error as Error;
        console.error(`Failed to attach video for ${participant.id}:`, trackError);
        
        setTrackState(prev => ({
          ...prev,
          video: { loading: false, error: trackError.message, ready: false }
        }));
        
        onError?.(trackError);
        
        if (videoElement) {
          try { camera.detach(videoElement); } catch {}
        }
      }
    };

    attachVideo();

    // Cleanup
    return () => {
      if (videoElement) {
        try {
          videoElement.removeEventListener('error', () => {});
          videoElement.removeEventListener('canplay', () => {});
          videoElement.removeEventListener('loadstart', () => {});
          videoElement.removeEventListener('loadedmetadata', () => {});
          camera.detach(videoElement);
        } catch (error) {
          console.warn('Video cleanup error:', error);
        }
      }
    };
  }, [camera, isLocal, participant.id, onError]);

  // Advanced audio track handling
  useEffect(() => {
    if (!audioContainerRef.current || !microphone || isLocal) return;

    let audioElement: HTMLAudioElement | null = null;

    const attachAudio = async () => {
      try {
        setTrackState(prev => ({
          ...prev,
          audio: { ...prev.audio, loading: true, error: null }
        }));

        audioElement = microphone.attach() as HTMLAudioElement;
        
        // Enhanced audio configuration
        audioElement.autoplay = true;
        audioElement.volume = 1.0;
        audioElement.style.display = 'none';
        audioElement.style.position = 'absolute';
        audioElement.style.pointerEvents = 'none';

        // Audio event handling
        const handleAudioError = (event: Event) => {
          const error = new Error(`Audio playback error for ${participant.id}`);
          console.warn('Audio error:', event, { participant: participant.id });
          
          setTrackState(prev => ({
            ...prev,
            audio: { ...prev.audio, error: error.message, loading: false }
          }));
          
          onError?.(error);
        };

        const handleAudioCanPlay = () => {
          setTrackState(prev => ({
            ...prev,
            audio: { loading: false, error: null, ready: true }
          }));
          console.debug(`Audio ready for ${participant.id}`);
        };

        audioElement.addEventListener('error', handleAudioError);
        audioElement.addEventListener('canplay', handleAudioCanPlay);

        audioContainerRef.current?.appendChild(audioElement);

      } catch (error) {
        const trackError = error as Error;
        console.error(`Failed to attach audio for ${participant.id}:`, trackError);
        
        setTrackState(prev => ({
          ...prev,
          audio: { loading: false, error: trackError.message, ready: false }
        }));
        
        onError?.(trackError);
        
        if (audioElement) {
          try { microphone.detach(audioElement); } catch {}
        }
      }
    };

    attachAudio();

    // Cleanup
    return () => {
      if (audioElement) {
        try {
          audioElement.removeEventListener('error', () => {});
          audioElement.removeEventListener('canplay', () => {});
          microphone.detach(audioElement);
        } catch (error) {
          console.warn('Audio cleanup error:', error);
        }
      }
    };
  }, [microphone, isLocal, participant.id, onError]);

  // Display name with fallbacks
  const displayName = participant.info?.firstName && participant.info?.lastName
    ? `${participant.info.firstName} ${participant.info.lastName}`
    : participant.info?.firstName || `User ${participant.id}`;

  const avatarFallback = participant.info?.firstName?.charAt(0) || displayName.charAt(0);

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Hidden audio container */}
      <div ref={audioContainerRef} style={{ display: 'none' }} />
      
      {/* Video container */}
      <div className="aspect-video relative">
        {hasCamera && participantStatus.mediaState.video === 'enabled' ? (
          <div className="relative w-full h-full">
            <div ref={videoContainerRef} className="w-full h-full" />
            
            {/* Loading overlay */}
            {trackState.video.loading && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
            
            {/* Error overlay */}
            {trackState.video.error && (
              <div className="absolute inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center">
                <div className="text-white text-center p-4">
                  <div className="text-lg">📹</div>
                  <div className="text-sm">Video Error</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Avatar/placeholder view
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            {participant.info?.avatarUrl ? (
              <img 
                src={participant.info.avatarUrl} 
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold">
                {avatarFallback.toUpperCase()}
              </div>
            )}
          </div>
        )}
        
        {/* Enhanced overlay with comprehensive status */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
          <div className="flex items-center justify-between text-white">
            {/* Name and status */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {displayName}{isLocal && ' (You)'}
              </span>
              
              {/* Connection status */}
              <div className={`w-2 h-2 rounded-full ${
                participantStatus.connectionState === 'connected' ? 'bg-green-400' :
                participantStatus.connectionState === 'connecting' ? 'bg-yellow-400' :
                participantStatus.connectionState === 'reconnecting' ? 'bg-orange-400' :
                'bg-red-400'
              }`} />
            </div>
            
            {/* Media indicators */}
            <div className="flex items-center space-x-1">
              {/* Speaking indicator */}
              {participantStatus.speaking && (
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              )}
              
              {/* Audio status */}
              {participantStatus.mediaState.audio === 'disabled' && (
                <span className="text-red-400">🔇</span>
              )}
              {participantStatus.mediaState.audio === 'muted' && (
                <span className="text-yellow-400">🔕</span>
              )}
              {trackState.audio.error && (
                <span className="text-red-400">⚠️</span>
              )}
              
              {/* Video status */}
              {participantStatus.mediaState.video === 'disabled' && (
                <span className="text-red-400">🚫</span>
              )}
              {participantStatus.mediaState.video === 'camera_off' && (
                <span className="text-yellow-400">📹</span>
              )}
              
              {/* Network quality */}
              {participantStatus.networkQuality !== 'unknown' && (
                <div className={`text-xs px-1 py-0.5 rounded ${
                  participantStatus.networkQuality === 'excellent' ? 'bg-green-600' :
                  participantStatus.networkQuality === 'good' ? 'bg-blue-600' :
                  participantStatus.networkQuality === 'poor' ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}>
                  {participantStatus.networkQuality.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Usage with Error Handling

Here's how to use the advanced participant component with proper error handling:

```typescript
import React, { useState } from 'react';
import { useParticipants } from 'vg-x07df';
import { AdvancedParticipant } from './AdvancedParticipant';

export function AdvancedCallView() {
  const participants = useParticipants();
  const [errors, setErrors] = useState<string[]>([]);

  const handleParticipantError = (error: Error) => {
    setErrors(prev => [...prev, error.message].slice(-5)); // Keep last 5 errors
  };

  const clearErrors = () => setErrors([]);

  return (
    <div className="p-4">
      {/* Error display */}
      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-red-800">Recent Errors:</h3>
            <button 
              onClick={clearErrors}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Clear
            </button>
          </div>
          {errors.map((error, index) => (
            <div key={index} className="text-sm text-red-700 mt-1">{error}</div>
          ))}
        </div>
      )}
      
      {/* Participants grid */}
      <div className="grid grid-cols-2 gap-4">
        {participants.map((participant) => (
          <AdvancedParticipant
            key={participant.id}
            participant={participant}
            isLocal={participant.role === 'CALLER'}
            onError={handleParticipantError}
            className="h-64" // Fixed height for grid layout
          />
        ))}
      </div>
      
      {participants.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          <div className="text-4xl mb-4">👥</div>
          <div className="text-lg">No participants in the call yet</div>
        </div>
      )}
    </div>
  );
}
```

## Key Features Explained

### 1. Loading States

The component shows loading indicators while tracks are being attached:

```typescript
// Track loading state
const [trackState, setTrackState] = useState<TrackState>({
  video: { loading: false, error: null, ready: false },
  audio: { loading: false, error: null, ready: false }
});

// Show loading overlay
{trackState.video.loading && (
  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
  </div>
)}
```

### 2. Error Handling and Retry Logic

Automatic retries for failed track attachments:

```typescript
let retryCount = 0;
const maxRetries = 3;

const handleVideoError = async (event: Event) => {
  // Log error and update state
  setTrackState(prev => ({
    ...prev,
    video: { ...prev.video, error: error.message, loading: false }
  }));
  
  // Retry logic with exponential backoff
  if (retryCount < maxRetries) {
    retryCount++;
    setTimeout(() => attachVideo(), 1000 * retryCount);
  } else {
    onError?.(error); // Notify parent component
  }
};
```

### 3. Network Quality Indicators

Visual indicators for connection quality using `useParticipantStatus`:

```typescript
const participantStatus = useParticipantStatus(participant.id);

// Connection status dot
<div className={`w-2 h-2 rounded-full ${
  participantStatus.connectionState === 'connected' ? 'bg-green-400' :
  participantStatus.connectionState === 'connecting' ? 'bg-yellow-400' :
  participantStatus.connectionState === 'reconnecting' ? 'bg-orange-400' :
  'bg-red-400'
}`} />

// Network quality badge
{participantStatus.networkQuality !== 'unknown' && (
  <div className={`text-xs px-1 py-0.5 rounded ${
    participantStatus.networkQuality === 'excellent' ? 'bg-green-600' :
    participantStatus.networkQuality === 'good' ? 'bg-blue-600' :
    participantStatus.networkQuality === 'poor' ? 'bg-yellow-600' :
    'bg-red-600'
  }`}>
    {participantStatus.networkQuality.charAt(0).toUpperCase()}
  </div>
)}
```

### 4. Speaking Detection

Animated indicator when participant is speaking:

```typescript
{participantStatus.speaking && (
  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
)}
```

### 5. Media State Indicators

Icons showing audio/video status:

```typescript
{/* Audio status */}
{participantStatus.mediaState.audio === 'disabled' && (
  <span className="text-red-400">🔇</span>
)}
{participantStatus.mediaState.audio === 'muted' && (
  <span className="text-yellow-400">🔕</span>
)}

{/* Video status */}
{participantStatus.mediaState.video === 'camera_off' && (
  <span className="text-yellow-400">📹</span>
)}
```

### 6. Enhanced Event Handling

Comprehensive event listeners for debugging and monitoring:

```typescript
// Video events
videoElement.addEventListener('error', handleVideoError);
videoElement.addEventListener('canplay', handleVideoCanPlay);
videoElement.addEventListener('loadstart', handleVideoLoadStart);
videoElement.addEventListener('loadedmetadata', handleVideoLoadedMetadata);

// Audio events  
audioElement.addEventListener('error', handleAudioError);
audioElement.addEventListener('canplay', handleAudioCanPlay);
```

## CSS Styling

The component includes comprehensive styling for all states:

```css
/* Loading spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Speaking indicator pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Connection status colors */
.bg-green-400 { background-color: #4ade80; }
.bg-yellow-400 { background-color: #facc15; }
.bg-orange-400 { background-color: #fb923c; }
.bg-red-400 { background-color: #f87171; }

/* Network quality badges */
.bg-green-600 { background-color: #16a34a; }
.bg-blue-600 { background-color: #2563eb; }
.bg-yellow-600 { background-color: #ca8a04; }
.bg-red-600 { background-color: #dc2626; }

/* Error overlay */
.bg-red-900 { background-color: #7f1d1d; }

/* Gradient overlay */
.bg-gradient-to-t {
  background-image: linear-gradient(to top, var(--tw-gradient-stops));
}
```

## Advanced Patterns

### Responsive Grid Layout

```typescript
function ResponsiveParticipantGrid() {
  const participants = useParticipants();
  
  const getGridClasses = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className={`grid gap-4 ${getGridClasses(participants.length)}`}>
      {participants.map((participant) => (
        <AdvancedParticipant
          key={participant.id}
          participant={participant}
          className="aspect-video"
        />
      ))}
    </div>
  );
}
```

### Error Recovery Dashboard

```typescript
function ErrorDashboard({ errors }: { errors: string[] }) {
  const [showDetails, setShowDetails] = useState(false);
  
  if (errors.length === 0) return null;

  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-red-500">⚠️</span>
          <span className="font-medium text-red-800">
            {errors.length} error{errors.length !== 1 ? 's' : ''} detected
          </span>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>
      
      {showDetails && (
        <div className="mt-3 space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="text-sm text-red-700 font-mono">
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Benefits Over Simple Implementation

### ✅ **Production Ready**
- Comprehensive error handling and recovery
- Loading states for better UX  
- Retry logic for network issues
- Proper cleanup and memory management

### ✅ **Rich Visual Feedback**
- Network quality indicators
- Speaking detection
- Connection status
- Media state indicators
- Error overlays

### ✅ **Debugging Support**
- Detailed event logging
- Error tracking and reporting
- Performance monitoring
- Development-friendly error messages

### ✅ **Scalable Architecture**
- Error callback system for parent components
- Configurable retry behavior
- Extensible status indicators
- Clean separation of concerns

## When to Use This Approach

Use the advanced participant component when you need:

- **Production reliability** - Real-world video calling applications
- **Rich user feedback** - Professional-looking interface with status indicators
- **Error resilience** - Graceful handling of network and media issues
- **Debugging capabilities** - Comprehensive logging and error tracking
- **Enterprise features** - Network quality monitoring, connection management

## Next Steps

- **[Audio Activation](./audio-activation.md)** - Handle browser autoplay restrictions
- **[Complete Interface](./complete-interface.md)** - Full production call interface  
- **[Performance Optimization](./performance.md)** - Advanced optimization techniques

The advanced participant component provides enterprise-grade reliability while maintaining the same simple `useParticipantMedia()` + `track.attach()` foundation! 🚀