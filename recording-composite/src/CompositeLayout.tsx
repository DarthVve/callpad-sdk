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
  const remoteParticipants = participants.filter(participant => participant.identity !== room.localParticipant.identity);
  // console.log('remoteParticipants', remoteParticipants);
  return (
    <div className="composite">
      {remoteParticipants.map((participant, index) => (
        <div className='p-tile' key={index}>
          <ParticipantTile key={participant.sid} participant={participant} tracks={tracks} />
        </div>
      ))}
    </div>  
  );
}