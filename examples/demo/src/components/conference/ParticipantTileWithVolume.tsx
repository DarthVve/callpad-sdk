import { useState, useRef, useEffect } from 'react';
import { useParticipantStatus, AudioTrack, type Participant } from 'vg-x07df';
import type { RemoteTrack, LocalTrack } from 'livekit-client';
import './ParticipantTile.css';

interface ParticipantTileWithVolumeProps {
  participant: Participant;
  isLocal?: boolean;
  videoTrack?: RemoteTrack | LocalTrack | null;
  audioTrack?: RemoteTrack | LocalTrack | null;
  className?: string;
}

/**
 * Enhanced ParticipantTile that demonstrates AudioTrack component features
 * including volume control and mute functionality
 */
export function ParticipantTileWithVolume({ 
  participant, 
  isLocal = false,
  videoTrack,
  audioTrack,
  className = ''
}: ParticipantTileWithVolumeProps) {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const participantStatus = useParticipantStatus(participant.id);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);

  // Handle video track using LiveKit's attach method
  useEffect(() => {
    if (!videoContainerRef.current || !videoTrack) return;

    let videoElement: HTMLVideoElement | null = null;

    try {
      const element = videoTrack.attach();
      videoElement = element as HTMLVideoElement;
      
      // Configure video element for optimal browser compatibility
      videoElement.className = 'participant-video';
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = isLocal;
      videoElement.controls = false;
      videoElement.disablePictureInPicture = true;
      
      // Add error handling for video playback issues
      const handleVideoError = (event: Event) => {
        console.warn('Video playback error for participant', participant.id, event);
      };
      
      const handleVideoCanPlay = () => {
        console.debug('Video ready for participant', participant.id);
      };

      const handleVideoLoadedMetadata = () => {
        console.debug('Video metadata loaded for participant', participant.id);
      };

      videoElement.addEventListener('error', handleVideoError);
      videoElement.addEventListener('canplay', handleVideoCanPlay);
      videoElement.addEventListener('loadedmetadata', handleVideoLoadedMetadata);
      
      videoContainerRef.current.appendChild(videoElement);

      return () => {
        if (videoElement) {
          videoElement.removeEventListener('error', handleVideoError);
          videoElement.removeEventListener('canplay', handleVideoCanPlay);
          videoElement.removeEventListener('loadedmetadata', handleVideoLoadedMetadata);
          videoTrack.detach(videoElement);
        }
      };
    } catch (error) {
      console.error('Failed to attach video track for participant', participant.id, error);
      
      // Cleanup on error
      if (videoElement) {
        try {
          videoTrack.detach(videoElement);
        } catch (detachError) {
          console.warn('Failed to detach video element after error', detachError);
        }
      }
    }
  }, [videoTrack, isLocal, participant.id]);

  const displayName = participant.info?.firstName && participant.info?.lastName
    ? `${participant.info.firstName} ${participant.info.lastName}`
    : participant.info?.firstName || `User ${participant.id}`;

  const getAvatarFallback = () => {
    if (participant.info?.firstName && participant.info?.lastName) {
      return `${participant.info.firstName.charAt(0)}${participant.info.lastName.charAt(0)}`.toUpperCase();
    }
    if (participant.info?.firstName) {
      return participant.info.firstName.charAt(0).toUpperCase();
    }
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <div className={`participant-tile ${isLocal ? 'local' : ''} ${className}`}>
      {/* Audio track rendering using AudioTrack component with volume control */}
      <AudioTrack 
        participantId={participant.id}
        volume={volume}
        muted={isMuted}
        onSubscriptionStatusChanged={(subscribed) => {
          console.debug('Audio subscription status changed', { 
            participantId: participant.id, 
            subscribed 
          });
        }}
      />
      
      <div className="video-container">
        {participantStatus.mediaState.video === 'enabled' && videoTrack ? (
          <div ref={videoContainerRef} className="video-track-container" />
        ) : (
          <div className="video-placeholder">
            {participant.info?.avatarUrl ? (
              <img src={participant.info.avatarUrl} alt={displayName} className="participant-avatar" />
            ) : (
              <div className="avatar-fallback">
                {getAvatarFallback()}
              </div>
            )}
          </div>
        )}
        
        {/* Overlay indicators */}
        <div className="participant-overlay">
          <div className="participant-name">
            {displayName}
            {isLocal && ' (You)'}
          </div>
          
          <div className="participant-indicators">
            {/* Connection status indicator */}
            <div className={`indicator connection-status ${participantStatus.connectionState}`}>
              {participantStatus.connectionState === 'connecting' && '🔄'}
              {participantStatus.connectionState === 'reconnecting' && '⚠️'}
              {participantStatus.connectionState === 'disconnected' && '❌'}
            </div>
            
            {/* Audio status */}
            {participantStatus.mediaState.audio === 'disabled' && (
              <div className="indicator muted">
                <span className="icon">🔇</span>
              </div>
            )}
            
            {participantStatus.mediaState.audio === 'muted' && (
              <div className="indicator muted">
                <span className="icon">🔕</span>
              </div>
            )}
            
            {/* Video status */}
            {participantStatus.mediaState.video === 'camera_off' && (
              <div className="indicator video-off">
                <span className="icon">📹</span>
              </div>
            )}
            
            {participantStatus.mediaState.video === 'disabled' && (
              <div className="indicator video-disabled">
                <span className="icon">🚫</span>
              </div>
            )}
            
            {/* Speaking indicator */}
            {participantStatus.speaking && (
              <div className="indicator speaking">
                <span className="icon">🗣️</span>
              </div>
            )}
            
            {/* Network quality */}
            {participantStatus.networkQuality !== 'unknown' && (
              <div className={`indicator connection-quality ${participantStatus.networkQuality.toLowerCase()}`}>
                <div className="signal-bars">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Volume controls for remote participants */}
          {!isLocal && (
            <div className="volume-controls">
              <button 
                className="volume-toggle"
                onClick={() => setShowVolumeControl(!showVolumeControl)}
                title="Volume control"
              >
                🔊
              </button>
              
              {showVolumeControl && (
                <div className="volume-panel">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume * 100}
                    onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
                    className="volume-slider"
                    title={`Volume: ${Math.round(volume * 100)}%`}
                  />
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="mute-button"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}