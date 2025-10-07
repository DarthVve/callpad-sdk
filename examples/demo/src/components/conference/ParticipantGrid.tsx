import { useMemo, useState } from 'react';
import { useParticipants, useLocalParticipantId, type Participant } from 'vg-x07df';
import { ParticipantWithMedia } from './ParticipantWithMedia';
import { PaginationControls } from './PaginationControls';
import './ParticipantGrid.css';

interface ParticipantGridProps {
  className?: string;
}

export function ParticipantGrid({ className = '' }: ParticipantGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const participantData = useParticipants({ page: currentPage, pageSize: 8 });
  const localParticipantId = useLocalParticipantId();
  
  const {
    participants,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    totalParticipants,
  } = participantData;

  const gridLayout = useMemo(() => {
    const count = participants.length;
    
    if (count === 0) return { cols: 1, rows: 1 };
    if (count === 1) return { cols: 1, rows: 1 };
    if (count === 2) return { cols: 2, rows: 1 };
    if (count <= 4) return { cols: 2, rows: 2 };
    if (count <= 6) return { cols: 3, rows: 2 };
    if (count <= 8) return { cols: 4, rows: 2 };
    
    return { cols: 4, rows: 2 };
  }, [participants.length]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  if (totalParticipants === 0) {
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
    <div className={`participant-grid-container ${className}`}>
      <div 
        className="participant-grid"
        style={{
          gridTemplateColumns: `repeat(${gridLayout.cols}, 1fr)`,
          gridTemplateRows: `repeat(${gridLayout.rows}, 1fr)`,
        }}
      >
        {participants.map((participant: Participant) => (
          <ParticipantWithMedia
            key={participant.id}
            participant={participant}
            isLocal={participant.id === localParticipantId}
          />
        ))}
      </div>
      
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
      />
    </div>
  );
}