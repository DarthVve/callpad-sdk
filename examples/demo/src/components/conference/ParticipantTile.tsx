import { useRef, useEffect } from 'react';
import { useParticipantStatus, type Participant } from 'vg-x07df';
import './ParticipantTile.css';

interface ParticipantTileProps {
  participant: Participant;
  isLocal?: boolean;
  videoTrack?: MediaStreamTrack | null;
  className?: string;
}

export function ParticipantTile({ 
  participant, 
  isLocal = false,
  videoTrack,
  className = ''
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const participantStatus = useParticipantStatus(participant.id);

  // Handle video track
  useEffect(() => {
    if (!videoRef.current || !videoTrack) return;

    const videoElement = videoRef.current;
    const stream = new MediaStream([videoTrack]);
    videoElement.srcObject = stream;

    return () => {
      videoElement.srcObject = null;
    };
  }, [videoTrack]);

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
      <div className="video-container">
        {participantStatus.mediaState.video === 'enabled' && videoTrack ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal} // Always mute local video to prevent feedback
            className="participant-video"
          />
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