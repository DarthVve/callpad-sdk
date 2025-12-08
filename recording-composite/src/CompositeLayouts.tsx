import { TrackReference } from '@livekit/components-core';
import {
  useParticipants,
  useRoomContext,
} from '@livekit/components-react';
import { ParticipantTile } from './ParticipantTile';
import './Composite.css'

export const AudioOnlyLayout = ({ tracks }: { tracks: TrackReference[] }) => {
  const participants = useParticipants();
  const room = useRoomContext();
  const remoteParticipants = participants.filter(participant => participant.identity !== room?.localParticipant?.identity);
  // console.log('remoteParticipants', remoteParticipants);
  
  // Calculate optimal grid columns based on participant count (max 100)
  const len = remoteParticipants.length;
  const participantCount = Math.min(len, 100);
  const getOptimalColumns = (count: number): number => {
    if (count === 0) return 1;
    if (count === 1) return 1;
    if (count <= 4) return 2;
    
    // For larger counts, use a dynamic formula based on square root
    // This creates a more balanced grid (closer to square)
    // For 50: sqrt(50) ≈ 7.07, so we'd get 7-8 columns
    const sqrt = Math.sqrt(count);
    const columns = Math.ceil(sqrt);
    
    // Ensure minimum of 3 columns and maximum of 10 columns
    return Math.max(3, Math.min(columns, 10));
  };
  
  const gridColumns = getOptimalColumns(participantCount);
  const useFlex = participantCount < 5;
  
  return (
    <div 
      className={`audio-composite ${useFlex ? 'audio-composite-flex' : 'audio-composite-grid'}`}
      style={{ 
        '--grid-columns': gridColumns
      } as React.CSSProperties}
    >
      {remoteParticipants.map((participant, index) => (
        <div className='p-tile' key={index}>
          <ParticipantTile key={participant?.sid} participant={participant} tracks={tracks} />
        </div>
      ))}
    </div>
  );
}