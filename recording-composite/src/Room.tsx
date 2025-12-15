import {
  RoomAudioRenderer,
  useRoomContext,
  useVisualStableUpdate,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { ReactElement } from 'react';
import useRecording from './useRecording';
import { AudioOnlyLayout, VideoOnlyLayout } from './components';

export function CompositeTemplate() {
  const room = useRoomContext();
  const { remoteVideoTracks, isAudioOnly, hasScreenShare, screenshareTrack } = useRecording(room);
  const sortedTracks = useVisualStableUpdate(remoteVideoTracks, 1);
  let mainTrack = sortedTracks.shift();

  if (hasScreenShare) {
    mainTrack = screenshareTrack
  } else {
    mainTrack = sortedTracks.shift();
  }
  
  // determine layout to use
  let main: ReactElement = <></>;
  if (room.state !== ConnectionState.Disconnected) {
    if (mainTrack) {
      main = <VideoOnlyLayout mainTrack={mainTrack} remainingTracks={remoteVideoTracks!} />
    } else {
      main = (
        <AudioOnlyLayout tracks={remoteVideoTracks} />
      );
    }

    if (isAudioOnly) {
      main = <AudioOnlyLayout tracks={remoteVideoTracks} />
    }
  }

  return (
    <div className='roomContainer'>
      {main}
      <RoomAudioRenderer />
    </div>
  );
}
