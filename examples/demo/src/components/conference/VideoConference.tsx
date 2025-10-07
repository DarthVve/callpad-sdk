import { useCallState, useAutoJoinForCurrentUser, useSdk, useErrorRecovery, useErrors, useCallTypeTracks, useAudioPlayback } from 'vg-x07df';
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
  const sdk = useSdk();
  const autoJoinState = sdk.store((state) => state.autoJoin);
  const userAutoJoin = useAutoJoinForCurrentUser();
  const errorRecovery = useErrorRecovery();
  const errorState = useErrors();
  const audioPlayback = useAudioPlayback();
  
  // Set up call-type-aware track management
  useCallTypeTracks({
    enableCameraOnVideoCall: true,
    enableMicrophoneOnCall: true,
    disableTracksOnCallEnd: true,
  });

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

  // Filter recent critical errors
  const criticalErrors = errorState.errors.slice(0, 3); // Show only most recent 3 critical errors

  return (
    <div className="video-conference">
      <ConferenceHeader
        onMinimize={handleMinimize}
        onFullscreen={handleFullscreen}
      />

      {/* Audio Activation Banner */}
      {status === 'ACTIVE' && audioPlayback.needsUserInteraction && (
        <div className="audio-activation-banner">
          <div className="audio-message">
            🔊 Audio playback requires your permission to start
          </div>
          <button
            onClick={audioPlayback.startAudio}
            disabled={audioPlayback.isStarting}
            className="audio-start-button"
          >
            {audioPlayback.isStarting ? '🔄 Starting...' : '🔊 Enable Audio'}
          </button>
        </div>
      )}

      {/* Error Recovery Banner */}
      {criticalErrors.length > 0 && (
        <div className="error-recovery-banner">
          <div className="error-message">
            ⚠️ Connection issues detected: {criticalErrors[0].message}
          </div>
          {criticalErrors.length > 0 && (
            <button
              onClick={() => errorRecovery.cancelAllRetries()}
              disabled={errorRecovery.status.isRecovering}
              className="recovery-button"
            >
              {errorRecovery.status.isRecovering ? '🔄 Retrying...' : '❌ Cancel Recovery'}
            </button>
          )}
        </div>
      )}
      
      <div className="conference-content">
        {status === 'CALLING' || status === 'RINGING' || status === 'ACCEPTED' || status === 'AWAITING_JOIN_INFO' || status === 'READY_TO_JOIN' || status === 'CONNECTING' ? (
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
                {status === 'CALLING' && 'Calling participants...'}
                {status === 'RINGING' && 'Ringing participants...'}
                {status === 'ACCEPTED' && 'Call accepted, joining room...'}
                {status === 'AWAITING_JOIN_INFO' && 'Getting room information...'}
                {status === 'READY_TO_JOIN' && 'Preparing to join...'}
                {status === 'CONNECTING' && 'Joining media session...'}
              </p>
              
              {/* Show current auto-join status */}
              {userAutoJoin.shouldAutoJoin && autoJoinState.status !== 'idle' && (
                <div className="mt-4 text-sm opacity-75">
                  {autoJoinState.status === 'pending' && '⏳ Auto-joining...'}
                  {autoJoinState.status === 'retrying' && `🔄 Retrying... (${autoJoinState.attempt}/${autoJoinState.maxAttempts})`}
                  {autoJoinState.status === 'failed' && '⚠️ Auto-join failed'}
                </div>
              )}
              
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