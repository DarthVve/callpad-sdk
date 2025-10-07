import { useState } from 'react';
import { useParticipants, AudioTrack, useLocalParticipantId } from 'vg-x07df';
import { ParticipantWithMedia } from './ParticipantWithMedia';
import { ParticipantTileWithVolume } from './ParticipantTileWithVolume';
import './ParticipantGrid.css';

/**
 * Demo component showing different ways to use the AudioTrack component
 */
export function AudioTrackDemo() {
  const [showEnhanced, setShowEnhanced] = useState(false);
  const { participants } = useParticipants();
  const localParticipantId = useLocalParticipantId();
  
  return (
    <div className="audio-track-demo">
      <div className="demo-header">
        <h2>AudioTrack Component Demo</h2>
        <button 
          onClick={() => setShowEnhanced(!showEnhanced)}
          className="demo-toggle"
        >
          {showEnhanced ? 'Show Basic' : 'Show Enhanced with Volume Control'}
        </button>
      </div>
      
      {/* Basic usage - Simple participant tiles with AudioTrack */}
      {!showEnhanced && (
        <div className="demo-section">
          <h3>Basic AudioTrack Usage</h3>
          <p>Simple participant tiles using the AudioTrack component with automatic audio handling.</p>
          
          <div 
            className="participant-grid"
            style={{
              gridTemplateColumns: `repeat(${Math.min(participants.length, 3)}, 1fr)`,
              gridTemplateRows: participants.length > 3 ? 'repeat(2, 1fr)' : '1fr',
            }}
          >
            {participants.slice(0, 6).map((participant) => (
              <ParticipantWithMedia
                key={participant.id}
                participant={participant}
                isLocal={participant.id === localParticipantId}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Enhanced usage - With volume control and mute */}
      {showEnhanced && (
        <div className="demo-section">
          <h3>Enhanced AudioTrack with Volume Control</h3>
          <p>Advanced participant tiles demonstrating volume control and individual muting capabilities.</p>
          
          <div 
            className="participant-grid"
            style={{
              gridTemplateColumns: `repeat(${Math.min(participants.length, 3)}, 1fr)`,
              gridTemplateRows: participants.length > 3 ? 'repeat(2, 1fr)' : '1fr',
            }}
          >
            {participants.slice(0, 6).map((participant) => (
              <ParticipantTileWithVolume
                key={participant.id}
                participant={participant}
                isLocal={participant.id === localParticipantId}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Code examples section */}
      <div className="code-examples">
        <h3>AudioTrack Component Examples</h3>
        
        <div className="example">
          <h4>Basic Usage</h4>
          <pre>{`<AudioTrack participantId="user123" />`}</pre>
        </div>
        
        <div className="example">
          <h4>With Volume Control</h4>
          <pre>{`<AudioTrack 
  participantId="user123"
  volume={0.5}
  muted={false}
/>`}</pre>
        </div>
        
        <div className="example">
          <h4>With Subscription Callback</h4>
          <pre>{`<AudioTrack 
  participantId="user123"
  onSubscriptionStatusChanged={(subscribed) => {
    console.log('Subscription:', subscribed);
  }}
/>`}</pre>
        </div>
        
        <div className="example">
          <h4>Using TrackRef Directly</h4>
          <pre>{`const { microphone } = useParticipantMedia(participantId);

<AudioTrack 
  trackRef={{
    track: microphone,
    participant,
    publication,
    source: Track.Source.Microphone
  }}
/>`}</pre>
        </div>
      </div>
      
      <style>{`
        .audio-track-demo {
          padding: 20px;
        }
        
        .demo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .demo-header h2 {
          margin: 0;
          color: #1f2937;
        }
        
        .demo-toggle {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        
        .demo-toggle:hover {
          background: #2563eb;
        }
        
        .demo-section {
          margin-bottom: 30px;
        }
        
        .demo-section h3 {
          color: #374151;
          margin-bottom: 10px;
        }
        
        .demo-section p {
          color: #6b7280;
          margin-bottom: 20px;
        }
        
        .code-examples {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 20px;
          margin-top: 30px;
        }
        
        .code-examples h3 {
          color: #1f2937;
          margin-bottom: 20px;
        }
        
        .example {
          background: white;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 15px;
        }
        
        .example h4 {
          color: #374151;
          margin: 0 0 10px 0;
          font-size: 14px;
        }
        
        .example pre {
          background: #1f2937;
          color: #f3f4f6;
          padding: 12px;
          border-radius: 4px;
          overflow-x: auto;
          margin: 0;
          font-size: 12px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}