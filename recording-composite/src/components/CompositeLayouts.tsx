import { TrackReference } from '@livekit/components-core';
import {
  TrackReferenceOrPlaceholder,
  useParticipants,
  useRoomContext,
} from '@livekit/components-react';
import { useEffect, useState } from 'react';
import { ParticipantTile, ParticipantTileWide } from './ParticipantTiles';
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
  const useFlex = participantCount < 4;

  return (
    <div
      className={`audio-composite ${useFlex ? 'audio-composite-flex' : 'audio-composite-grid'}`}
      style={{
        '--grid-columns': gridColumns
      } as React.CSSProperties}
    >
      {remoteParticipants.map((participant, index) => (
        <div className={`${participantCount === 2 ? 'p-tile-two' : participantCount === 3 ? 'p-tile-three' : participantCount === 4 ? 'p-tile-four' : 'p-tile'}`} key={index}>
          <ParticipantTile key={participant?.sid} participant={participant} tracks={tracks} size={`${participantCount === 2 ? 'large' : participantCount === 3 ? 'medium' : participantCount === 4 ? 'medium' : 'small'}`} />
        </div>
      ))}
    </div>
  );
}

export const VideoOnlyLayout = ({ mainTrack, remainingTracks }: { mainTrack: TrackReferenceOrPlaceholder, remainingTracks: TrackReference[] }) => {
  const participants = useParticipants();
  const room = useRoomContext();
  const remoteParticipants = participants.filter(participant => participant.identity !== mainTrack.participant?.identity && participant.identity !== room?.localParticipant?.identity);
  const PARTICIPANTS_PER_PAGE = 8;
  const ROTATION_INTERVAL_MS = 5000; // 5 seconds per page
  
  const totalParticipants = remoteParticipants.length;
  const hasCarousel = totalParticipants > PARTICIPANTS_PER_PAGE;
  const totalPages = hasCarousel ? Math.ceil(totalParticipants / PARTICIPANTS_PER_PAGE) : 1;
  
  const [currentPage, setCurrentPage] = useState(0);
  
  // Auto-rotate carousel when there are more than 8 participants
  useEffect(() => {
    if (!hasCarousel) return;
    
    const interval = setInterval(() => {
      setCurrentPage((prevPage) => (prevPage + 1) % totalPages);
    }, ROTATION_INTERVAL_MS);
    
    return () => clearInterval(interval);
  }, [hasCarousel, totalPages]);
  
  // Calculate which participants to display for current page
  const getDisplayTracks = () => {
    if (!hasCarousel) {
      return remoteParticipants.slice(0, PARTICIPANTS_PER_PAGE);
    }
    
    const startIndex = currentPage * PARTICIPANTS_PER_PAGE;
    const endIndex = startIndex + PARTICIPANTS_PER_PAGE;
    return remoteParticipants.slice(startIndex, endIndex);
  };
  
  const displayTracks = getDisplayTracks();
  const useGrid = remoteParticipants.length > 4;
  
  return (
    <div className='video-composite'>
      <ParticipantTileWide participant={mainTrack.participant} mainTrack={mainTrack as TrackReference} />
      <div className='tracks-container'>
        <div className={useGrid ? 'remaining-tracks-grid' : 'remaining-tracks'}>
          {displayTracks.map((participant, index) => {
            // Use a stable key that includes the page to ensure proper re-rendering
            const globalIndex = hasCarousel ? currentPage * PARTICIPANTS_PER_PAGE + index : index;
            return (
              <div className='p-tile' key={`${participant?.sid || globalIndex}-${currentPage}`}>
                <ParticipantTile participant={participant} tracks={remainingTracks as TrackReference[]} />
              </div>
            );
          })}
        </div>
        {hasCarousel && (
          <div className='page-indicator'>
            <p className='page-indicator-text'>{currentPage + 1}/{totalPages}</p>
          </div>
        )}
      </div>
    </div>
  );
}