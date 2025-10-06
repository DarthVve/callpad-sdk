import { useState } from 'react';
import { useCallActions } from 'vg-callpad-x07df';
import './CallInitiator.css';

interface CallInitiatorProps {
  onCallInitiated?: () => void;
}

export function CallInitiator({ onCallInitiated }: CallInitiatorProps) {
  const [userIds, setUserIds] = useState('');
  const [callType, setCallType] = useState<'AUDIO' | 'VIDEO'>('AUDIO');
  const [isInitiating, setIsInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { initiate } = useCallActions();

  const parseUserIds = (input: string): string[] => {
    return input
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);
  };

  const handleInitiateCall = async () => {
    const invitees = parseUserIds(userIds);
    
    if (invitees.length === 0) {
      setError('Please enter at least one user ID');
      return;
    }

    setIsInitiating(true);
    setError(null);

    try {
      await initiate(invitees, callType);

      onCallInitiated?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate call';
      setError(errorMessage);
    } finally {
      setIsInitiating(false);
    }
  };

  const clearInput = () => {
    setUserIds('');
    setError(null);
  };

  const parsedUserIds = parseUserIds(userIds);

  return (
    <div className="call-initiator">
      <div className="call-initiator-header">
        <h1>Start a Call</h1>
        <p>Enter user IDs to start a video or audio call</p>
      </div>

      <div className="call-setup-form">
        <div className="form-section">
          <label htmlFor="userIds">User IDs to Call</label>
          <textarea
            id="userIds"
            value={userIds}
            onChange={(e) => setUserIds(e.target.value)}
            placeholder="Enter user IDs separated by commas&#10;Example: 123, 456, 789"
            className="user-ids-input"
            rows={3}
            disabled={isInitiating}
          />
          <div className="input-helper">
            {parsedUserIds.length > 0 && (
              <span className="parsed-count">
                {parsedUserIds.length} user{parsedUserIds.length !== 1 ? 's' : ''} will be invited
              </span>
            )}
          </div>
        </div>

        <div className="call-type-selector">
          <label>Call Type:</label>
          <div className="call-type-buttons">
            <button
              className={`call-type-button ${callType === 'AUDIO' ? 'active' : ''}`}
              onClick={() => setCallType('AUDIO')}
              disabled={isInitiating}
            >
              <span className="icon">🎤</span>
              Audio Call
            </button>
            <button
              className={`call-type-button ${callType === 'VIDEO' ? 'active' : ''}`}
              onClick={() => setCallType('VIDEO')}
              disabled={isInitiating}
            >
              <span className="icon">🎥</span>
              Video Call
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      <div className="call-actions">
        {userIds.trim() && (
          <button
            onClick={clearInput}
            className="clear-button"
            disabled={isInitiating}
          >
            Clear Input
          </button>
        )}
        
        <button
          onClick={handleInitiateCall}
          className="initiate-button"
          disabled={parsedUserIds.length === 0 || isInitiating}
        >
          {isInitiating ? (
            <>
              <div className="loading-spinner"></div>
              Initiating {callType.toLowerCase()} call...
            </>
          ) : (
            <>
              Start {callType.toLowerCase()} call with {parsedUserIds.length} user{parsedUserIds.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
}