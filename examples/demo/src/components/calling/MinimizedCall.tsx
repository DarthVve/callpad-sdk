import { useCallState, useParticipants } from 'vg-x07df';
import { useCallTimer } from '../../hooks/useCallTimer';
import './MinimizedCall.css';

interface MinimizedCallProps {
  onRestore: () => void;
  onLeaveCall: () => void;
}

export function MinimizedCall({ onRestore, onLeaveCall }: MinimizedCallProps) {
  const { status } = useCallState();
  const participants = useParticipants();
  const { formattedDuration, isActive } = useCallTimer();

  const participantCount = participants.length;
  const participantNames = participants
    .slice(0, 2)
    .map(p => p.firstName || 'Unknown')
    .join(', ');

  const getStatusText = () => {
    switch (status) {
      case 'RINGING':
        return 'Ringing...';
      case 'ACCEPTED':
      case 'AWAITING_JOIN_INFO':
        return 'Connecting...';
      case 'ACTIVE':
        return formattedDuration;
      default:
        return 'In call';
    }
  };

  const getParticipantText = () => {
    if (participantCount === 0) return 'No participants';
    if (participantCount === 1) return participantNames;
    if (participantCount === 2) return participantNames;
    return `${participantNames} +${participantCount - 2} more`;
  };

  return (
    <div className="minimized-call">
      <div className="minimized-call-content" onClick={onRestore}>
        <div className="call-info">
          <div className="call-status">
            <div className={`status-indicator ${isActive ? 'active' : 'connecting'}`}></div>
            <span className="status-text">{getStatusText()}</span>
          </div>
          <div className="participant-info">
            <span className="participant-text">{getParticipantText()}</span>
          </div>
        </div>
        
        <div className="call-icon">
          <span>📞</span>
        </div>
      </div>
      
      <div className="minimized-call-controls">
        <button 
          className="control-button restore"
          onClick={onRestore}
          title="Restore call"
        >
          ⬆
        </button>
        <button 
          className="control-button end-call"
          onClick={onLeaveCall}
          title="End call"
        >
          📞
        </button>
      </div>
    </div>
  );
}