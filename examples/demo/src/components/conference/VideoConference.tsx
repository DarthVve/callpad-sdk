import { useCallState } from '@voyatek/callpad-sdk';
import { ConferenceHeader } from './ConferenceHeader';
import { ParticipantGrid } from './ParticipantGrid';
import { EnhancedControlBar } from './EnhancedControlBar';
import './VideoConference.css';

interface VideoConferenceProps {
  onLeaveCall?: () => void;
  onMinimize?: () => void;
}

export function VideoConference({ onLeaveCall, onMinimize }: VideoConferenceProps) {
  const { status } = useCallState();

  const handleMinimize = () => {
    onMinimize?.();
  };

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  const handleLeaveCall = () => {
    onLeaveCall?.();
  };

  if (status === 'IDLE' || status === 'ENDED') {
    return null;
  }

  return (
    <div className="video-conference">
      <ConferenceHeader
        onMinimize={handleMinimize}
        onFullscreen={handleFullscreen}
      />
      
      <div className="conference-content">
        {status === 'RINGING' || status === 'ACCEPTED' || status === 'AWAITING_JOIN_INFO' ? (
          <div className="call-connecting">
            <div className="connecting-content">
              <div className="connecting-icon">
                <div className="pulse-ring"></div>
                <div className="pulse-ring delay-1"></div>
                <div className="pulse-ring delay-2"></div>
                <span className="call-icon">📞</span>
              </div>
              <h2>Connecting to call...</h2>
              <p>
                {status === 'RINGING' && 'Ringing participants...'}
                {status === 'ACCEPTED' && 'Call accepted, joining room...'}
                {status === 'AWAITING_JOIN_INFO' && 'Getting room information...'}
              </p>
              <div className="connecting-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="video-area">
            <ParticipantGrid />
          </div>
        )}
      </div>

      {status === 'ACTIVE' && (
        <EnhancedControlBar onLeaveCall={handleLeaveCall} />
      )}
    </div>
  );
}