import { useState } from 'react';
import { 
  useMediaControls, 
  useDevices, 
  useParticipantsInCall, 
  useCallActions,
  useConnection,
  useCallState
} from '@voyatek/callpad-sdk';
import { useCallTimer } from '../../hooks/useCallTimer';
import './EnhancedControlBar.css';

interface EnhancedControlBarProps {
  onLeaveCall?: () => void;
}

export function EnhancedControlBar({ onLeaveCall }: EnhancedControlBarProps) {
  const [showDevices, setShowDevices] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  
  const { 
    isAudioEnabled, 
    isVideoEnabled, 
    toggleMicrophone, 
    toggleCamera,
    isLoading: mediaLoading 
  } = useMediaControls();
  
  const { 
    mics, 
    cams, 
    speakers, 
    switchMicrophone, 
    switchCamera, 
    switchSpeaker 
  } = useDevices();
  
  const participants = useParticipantsInCall();
  const { leave } = useCallActions();
  const { quality } = useConnection();
  const { formattedDuration } = useCallTimer();

  // Get current call ID from SDK state
  const { id: callId } = useCallState();

  const handleLeaveCall = async () => {
    if (!callId) {
      console.error('No active call to leave');
      return;
    }
    
    try {
      await leave(callId);
      onLeaveCall?.();
    } catch (error) {
      console.error('Failed to leave call:', error);
    }
  };

  const participantCount = participants.length;

  return (
    <div className="enhanced-control-bar">
      {/* Left section - Call info */}
      <div className="control-section left">
        <div className="call-info">
          <span className="call-duration">{formattedDuration}</span>
          {quality && (
            <div className={`connection-indicator ${quality.toLowerCase()}`}>
              <div className="signal-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center section - Media controls */}
      <div className="control-section center">
        <div className="media-controls">
          {/* Microphone control */}
          <div className="control-group">
            <button
              onClick={toggleMicrophone}
              disabled={mediaLoading}
              className={`control-button microphone ${!isAudioEnabled ? 'disabled' : ''}`}
              title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              <span className="icon">
                {isAudioEnabled ? '🎤' : '🔇'}
              </span>
            </button>
            
            {mics.length > 1 && (
              <button 
                className="device-selector-trigger"
                onClick={() => setShowDevices(!showDevices)}
                title="Select microphone"
              >
                ▼
              </button>
            )}
          </div>

          {/* Camera control */}
          <div className="control-group">
            <button
              onClick={toggleCamera}
              disabled={mediaLoading}
              className={`control-button camera ${!isVideoEnabled ? 'disabled' : ''}`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              <span className="icon">
                {isVideoEnabled ? '📹' : '📷'}
              </span>
            </button>
            
            {cams.length > 1 && (
              <button 
                className="device-selector-trigger"
                onClick={() => setShowDevices(!showDevices)}
                title="Select camera"
              >
                ▼
              </button>
            )}
          </div>

          {/* Screen share control */}
          <button
            className="control-button screen-share"
            title="Share screen"
            onClick={() => {
              // TODO: Implement screen sharing
              console.log('Screen share clicked');
            }}
          >
            <span className="icon">🖥️</span>
          </button>

          {/* Participants panel */}
          <button
            className={`control-button participants ${showParticipants ? 'active' : ''}`}
            onClick={() => setShowParticipants(!showParticipants)}
            title="Show participants"
          >
            <span className="icon">👥</span>
            {participantCount > 0 && (
              <span className="participant-count">{participantCount}</span>
            )}
          </button>

          {/* Chat control */}
          <button
            className="control-button chat"
            title="Open chat"
            onClick={() => {
              // TODO: Implement chat
              console.log('Chat clicked');
            }}
          >
            <span className="icon">💬</span>
          </button>

          {/* More options */}
          <button
            className={`control-button more ${showDevices ? 'active' : ''}`}
            onClick={() => setShowDevices(!showDevices)}
            title="More options"
          >
            <span className="icon">⚙️</span>
          </button>
        </div>
      </div>

      {/* Right section - Call actions */}
      <div className="control-section right">
        <button
          onClick={handleLeaveCall}
          className="control-button leave-call"
          title="Leave call"
        >
          <span className="icon">📞</span>
        </button>
      </div>

      {/* Device selector dropdown */}
      {showDevices && (
        <div className="device-selector-panel">
          <div className="device-section">
            <h4>Microphone</h4>
            {mics.map((mic: any) => (
              <button
                key={mic.deviceId}
                onClick={() => switchMicrophone(mic.deviceId)}
                className="device-option"
              >
                {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
              </button>
            ))}
          </div>

          <div className="device-section">
            <h4>Camera</h4>
            {cams.map((cam: any) => (
              <button
                key={cam.deviceId}
                onClick={() => switchCamera(cam.deviceId)}
                className="device-option"
              >
                {cam.label || `Camera ${cam.deviceId.slice(0, 8)}`}
              </button>
            ))}
          </div>

          <div className="device-section">
            <h4>Speaker</h4>
            {speakers.map((speaker: any) => (
              <button
                key={speaker.deviceId}
                onClick={() => switchSpeaker(speaker.deviceId)}
                className="device-option"
              >
                {speaker.label || `Speaker ${speaker.deviceId.slice(0, 8)}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Participants panel */}
      {showParticipants && (
        <div className="participants-panel">
          <h4>Participants ({participantCount})</h4>
          <div className="participants-list">
            {participants.map((participant: any) => (
              <div key={participant.id} className="participant-item">
                <div className="participant-avatar">
                  {participant.avatarUrl ? (
                    <img src={participant.avatarUrl} alt="" />
                  ) : (
                    <span>
                      {(participant.firstName || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="participant-name">
                  {[participant.firstName, participant.lastName].filter(Boolean).join(' ') || `User ${participant.id}`}
                </span>
                {participant.isSpeaking && (
                  <span className="speaking-indicator">🗣️</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}