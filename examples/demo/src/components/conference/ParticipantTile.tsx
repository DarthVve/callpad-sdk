import { useRef, useEffect } from 'react';
import { useParticipantStatus, AudioTrack, type Participant } from 'vg-x07df';
import type { RemoteTrack, LocalTrack } from 'livekit-client';
import './ParticipantTile.css';

interface ParticipantTileProps {
  participant: Participant;
  isLocal?: boolean;
  videoTrack?: RemoteTrack | LocalTrack | null;
  audioTrack?: RemoteTrack | LocalTrack | null;
  className?: string;
}

export function ParticipantTile({ 
  participant, 
  isLocal = false,
  videoTrack,
  audioTrack,
  className = ''
}: ParticipantTileProps) {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const participantStatus = useParticipantStatus(participant.id);

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
      videoElement.playsInline = true; // Important for mobile browsers
      videoElement.muted = isLocal; // Always mute local video to prevent feedback
      videoElement.controls = false; // Hide controls since we manage playback
      videoElement.disablePictureInPicture = true; // Disable PiP to prevent confusion
      
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
      {/* Audio track rendering using AudioTrack component */}
      <AudioTrack 
        participantId={participant.id}
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
        </div>
      </div>
    </div>
  );
}