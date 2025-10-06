import { useCallState, useCallActions } from 'vg-callpad-x07df';
import './IncomingCallModal.css';

export function IncomingCallModal() {
  const { incomingCall } = useCallState();
  const { accept, decline } = useCallActions();

  const handleAccept = async () => {
    if (!incomingCall) return;
    
    try {
      await accept(incomingCall.callId);
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const handleDecline = async () => {
    if (!incomingCall) return;
    
    try {
      await decline(incomingCall.callId);
    } catch (error) {
      console.error('Failed to decline call:', error);
    }
  };

  if (!incomingCall) return null;

  return (
    <div className="incoming-call-modal-overlay">
      <div className="incoming-call-modal">
        <div className="incoming-call-content">
          <div className="caller-avatar">
            {incomingCall.caller.avatarUrl ? (
              <img src={incomingCall.caller.avatarUrl} alt={incomingCall.caller.name} />
            ) : (
              <div className="avatar-placeholder">
                {incomingCall.caller.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="call-details">
            <h2>{incomingCall.caller.name}</h2>
            <p>Incoming {incomingCall.type.toLowerCase()} call</p>
          </div>

          <div className="call-actions">
            <button 
              className="decline-button"
              onClick={handleDecline}
              title="Decline call"
            >
              <span className="icon">📞</span>
              Decline
            </button>
            
            <button 
              className="accept-button"
              onClick={handleAccept}
              title="Accept call"
            >
              <span className="icon">📞</span>
              Accept
            </button>
          </div>
        </div>

        <div className="incoming-call-animation">
          <div className="pulse-ring"></div>
          <div className="pulse-ring delay-1"></div>
          <div className="pulse-ring delay-2"></div>
        </div>
      </div>
    </div>
  );
}