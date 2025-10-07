import { useParticipantMedia, type Participant } from 'vg-x07df';
import { ParticipantTile } from './ParticipantTile';

interface ParticipantWithMediaProps {
  participant: Participant;
  isLocal?: boolean;
  className?: string;
}

/**
 * Wrapper component that fetches media tracks for a participant
 * and passes them to ParticipantTile
 */
export function ParticipantWithMedia({ 
  participant, 
  isLocal = false,
  className = ''
}: ParticipantWithMediaProps) {
  const { camera, microphone } = useParticipantMedia(participant.id);

  return (
    <ParticipantTile
      participant={participant}
      isLocal={isLocal}
      videoTrack={camera || null}
      audioTrack={microphone || null}
      className={className}
    />
  );
}