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

  const MAX_PARTICIPANTS = 100;
  const PARTICIPANTS_PER_PAGE = 25; // 5 rows * 5 columns
  const GRID_COLUMNS_PER_PAGE = 5;
  const ROTATION_INTERVAL_MS = 5000; // 5 seconds per page

  const cappedRemoteParticipants = remoteParticipants.slice(0, MAX_PARTICIPANTS);
  const participantCount = cappedRemoteParticipants.length;
  const hasCarousel = participantCount > PARTICIPANTS_PER_PAGE;
  const totalPages = hasCarousel ? Math.ceil(participantCount / PARTICIPANTS_PER_PAGE) : 1;

  const [currentPage, setCurrentPage] = useState(0);
  const clampedPage = Math.min(currentPage, totalPages - 1);

  // Clamp currentPage when totalPages decreases (e.g., participants leave)
  useEffect(() => {
    setCurrentPage((prev) => (prev >= totalPages ? Math.max(0, totalPages - 1) : prev));
  }, [totalPages]);

  // Auto-rotate carousel when there are more than 25 participants
  useEffect(() => {
    if (!hasCarousel) {
      setCurrentPage(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentPage((prevPage) => (prevPage + 1) % totalPages);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [hasCarousel, totalPages]);

  // Calculate optimal grid columns based on participant count
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

  // Calculate which participants to display for current page
  const getDisplayParticipants = () => {
    if (!hasCarousel) return cappedRemoteParticipants;

    const startIndex = clampedPage * PARTICIPANTS_PER_PAGE;
    const endIndex = startIndex + PARTICIPANTS_PER_PAGE;
    return cappedRemoteParticipants.slice(startIndex, endIndex);
  };

  const displayParticipants = getDisplayParticipants();
  const gridColumns = hasCarousel ? GRID_COLUMNS_PER_PAGE : getOptimalColumns(participantCount);
  const useFlex = !hasCarousel && participantCount < 4;

  return (
    <div
      className={`audio-composite ${useFlex ? 'audio-composite-flex' : 'audio-composite-grid'} ${hasCarousel ? 'audio-composite-grid-paged' : ''}`}
      style={{
        '--grid-columns': gridColumns,
        ...(hasCarousel ? { paddingBottom: '3rem' } : {}),
      } as React.CSSProperties}
    >
      {displayParticipants.map((participant, index) => {
        const globalIndex = hasCarousel ? clampedPage * PARTICIPANTS_PER_PAGE + index : index;
        const stableParticipantKey =
          participant?.sid ||
          participant?.identity ||
          participant?.name ||
          `idx-${globalIndex}`;
        const tileWrapperClass = hasCarousel
          ? 'p-tile-audio-paged'
          : (participantCount === 2 ? 'p-tile-two' : participantCount === 3 ? 'p-tile-three' : participantCount === 4 ? 'p-tile-four' : 'p-tile');

        const tileSize = hasCarousel
          ? 'small'
          : (participantCount === 2 ? 'large' : participantCount === 3 ? 'medium' : participantCount === 4 ? 'medium' : 'small');

        return (
          <div className={tileWrapperClass} key={stableParticipantKey}>
            <ParticipantTile participant={participant} tracks={tracks} size={tileSize} />
          </div>
        );
      })}

      {hasCarousel && (
        <div className='page-indicator audio-page-indicator'>
          <p className='page-indicator-text'>{clampedPage + 1}/{totalPages}</p>
        </div>
      )}
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
  const clampedPage = Math.min(currentPage, totalPages - 1);

  // Clamp currentPage when totalPages decreases (e.g., participants leave)
  useEffect(() => {
    setCurrentPage((prev) => (prev >= totalPages ? Math.max(0, totalPages - 1) : prev));
  }, [totalPages]);
  
  // Auto-rotate carousel when there are more than 8 participants
  useEffect(() => {
    if (!hasCarousel) {
      setCurrentPage(0);
      return;
    }
    
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
    
    const startIndex = clampedPage * PARTICIPANTS_PER_PAGE;
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
            const globalIndex = hasCarousel ? clampedPage * PARTICIPANTS_PER_PAGE + index : index;
            return (
              <div className='p-tile' key={`${participant?.sid || globalIndex}-${clampedPage}`}>
                <ParticipantTile participant={participant} tracks={remainingTracks as TrackReference[]} />
              </div>
            );
          })}
        </div>
        {hasCarousel && (
          <div className='page-indicator'>
            <p className='page-indicator-text'>{clampedPage + 1}/{totalPages}</p>
          </div>
        )}
      </div>
    </div>
  );
}