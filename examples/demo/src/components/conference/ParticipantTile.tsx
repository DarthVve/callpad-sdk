import { useRef, useEffect } from 'react';
import type { Participant } from 'vg-callpad-x07df';
import './ParticipantTile.css';

interface ParticipantTileProps {
  participant: Participant;
  isLocal?: boolean;
  videoTrack?: MediaStreamTrack | null;
  isMuted?: boolean;
  isVideoEnabled?: boolean;
  className?: string;
}

export function ParticipantTile({ 
  participant, 
  isLocal = false,
  videoTrack,
  isMuted = false,
  isVideoEnabled = true,
  className = ''
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const displayName = [participant.firstName, participant.lastName]
    .filter(Boolean)
    .join(' ') || `User ${participant.id}`;

  const getAvatarFallback = () => {
    if (participant.firstName && participant.lastName) {
      return `${participant.firstName.charAt(0)}${participant.lastName.charAt(0)}`.toUpperCase();
    }
    if (participant.firstName) {
      return participant.firstName.charAt(0).toUpperCase();
    }
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <div className={`participant-tile ${isLocal ? 'local' : ''} ${className}`}>
      <div className="video-container">
        {isVideoEnabled && videoTrack ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal} // Always mute local video to prevent feedback
            className="participant-video"
          />
        ) : (
          <div className="video-placeholder">
            {participant.avatarUrl ? (
              <img src={participant.avatarUrl} alt={displayName} className="participant-avatar" />
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
            {isMuted && (
              <div className="indicator muted">
                <span className="icon">🔇</span>
              </div>
            )}
            
            {!isVideoEnabled && (
              <div className="indicator video-off">
                <span className="icon">📹</span>
              </div>
            )}
            
            {participant.isSpeaking && (
              <div className="indicator speaking">
                <span className="icon">🗣️</span>
              </div>
            )}
            
            {participant.connectionQuality && (
              <div className={`indicator connection-quality ${participant.connectionQuality.toLowerCase()}`}>
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