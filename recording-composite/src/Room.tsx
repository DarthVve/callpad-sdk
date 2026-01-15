import {
  RoomAudioRenderer,
  TrackReferenceOrPlaceholder,
  useRoomContext,
  useVisualStableUpdate,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { ReactElement, useRef } from 'react';
import useRecording from './useRecording';
import { AudioOnlyLayout, VideoOnlyLayout } from './components';

export function CompositeTemplate() {
  const room = useRoomContext();
  const { remoteVideoTracks, isAudioOnly, hasScreenShare, screenshareTrack } = useRecording(room);
  const sortedTracks = useVisualStableUpdate(remoteVideoTracks, 1);

  const mainTrackRef = useRef<TrackReferenceOrPlaceholder | undefined>(undefined);
  mainTrackRef.current = hasScreenShare ? screenshareTrack : sortedTracks[0];
  const mainTrack = mainTrackRef.current;
  
  // determine layout to use
  let main: ReactElement = <></>;
  if (room.state !== ConnectionState.Disconnected) {
    if (mainTrack && !isAudioOnly) {
      main = <VideoOnlyLayout mainTrack={mainTrack} remainingTracks={remoteVideoTracks!} />
    } else {
      main = (
        <AudioOnlyLayout tracks={remoteVideoTracks} />
      );
    }
  }

  return (
    <div className='roomContainer'>
      {main}
      <RoomAudioRenderer />
    </div>
  );
}
