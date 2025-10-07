import { useState } from 'react';
import { useEvent, useCallActions, useCallState, SdkEventType } from 'vg-x07df';
import type { CallIncomingEvent } from 'vg-x07df';
import './IncomingCallModal.css';

export function IncomingCallModal() {
  const [incomingCall, setIncomingCall] = useState<CallIncomingEvent | null>(null);
  const { accept, decline } = useCallActions();
  const { status } = useCallState();
  
  // Listen for incoming call events
  useEvent(SdkEventType.CALL_INCOMING, (event) => {
    setIncomingCall(event.payload);
  });
  
  // Clear incoming call when call status changes away from ringing
  
  useEvent(SdkEventType.CALL_DECLINED, () => {
    setIncomingCall(null);
  });
  
  useEvent(SdkEventType.CALL_ENDED, () => {
    setIncomingCall(null);
  });
  
  useEvent(SdkEventType.CALL_TIMEOUT, () => {
    setIncomingCall(null);
  });
  
  useEvent(SdkEventType.CALL_CANCELED, () => {
    setIncomingCall(null);
  });

  const handleAccept = async () => {
    if (!incomingCall) return;
    
    try {
      await accept(incomingCall.callId);
      // Modal will be hidden when call status changes from RINGING
    } catch (error) {
      console.error('Failed to accept call:', error);
      // Could add toast notification here in a real app
    }
  };

  const handleDecline = async () => {
    if (!incomingCall) return;
    
    try {
      await decline(incomingCall.callId);
      // Modal will be hidden by the CALL_DECLINED event
    } catch (error) {
      console.error('Failed to decline call:', error);
      // Could add toast notification here in a real app
    }
  };

  // Only show modal if we have an incoming call and we're in the right state
  if (!incomingCall || status !== 'RINGING') return null;

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