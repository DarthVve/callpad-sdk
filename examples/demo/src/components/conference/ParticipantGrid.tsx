import { useMemo } from 'react';
import { useParticipantsInCall } from '@voyatek/callpad-sdk';
import { ParticipantTile } from './ParticipantTile';
import './ParticipantGrid.css';

interface ParticipantGridProps {
  className?: string;
}

export function ParticipantGrid({ className = '' }: ParticipantGridProps) {
  const participants = useParticipantsInCall();

  // Calculate grid layout based on participant count
  const gridLayout = useMemo(() => {
    const count = participants.length;
    
    if (count === 0) return { cols: 1, rows: 1 };
    if (count === 1) return { cols: 1, rows: 1 };
    if (count === 2) return { cols: 2, rows: 1 };
    if (count <= 4) return { cols: 2, rows: 2 };
    if (count <= 6) return { cols: 3, rows: 2 };
    if (count <= 9) return { cols: 3, rows: 3 };
    if (count <= 12) return { cols: 4, rows: 3 };
    
    // For more than 12 participants, use 4x4 and show only first 16
    return { cols: 4, rows: 4 };
  }, [participants.length]);

  // Limit to maximum 16 participants for display
  const displayParticipants = participants.slice(0, 16);

  if (participants.length === 0) {
    return (
      <div className={`participant-grid empty ${className}`}>
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No participants yet</h3>
          <p>Waiting for others to join the call...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`participant-grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${gridLayout.cols}, 1fr)`,
        gridTemplateRows: `repeat(${gridLayout.rows}, 1fr)`,
      }}
    >
      {displayParticipants.map((participant: any) => (
        <ParticipantTile
          key={participant.id}
          participant={participant}
          isLocal={participant.id === 'local'} // Adjust based on how you identify local participant
          // TODO: Connect these props to actual media tracks from the SDK
          videoTrack={null}
          isMuted={false}
          isVideoEnabled={true}
        />
      ))}
      
      {/* Show participant count if more than can be displayed */}
      {participants.length > 16 && (
        <div className="overflow-indicator">
          <div className="overflow-content">
            <span className="overflow-count">+{participants.length - 16}</span>
            <span className="overflow-text">more</span>
          </div>
        </div>
      )}
    </div>
  );
}