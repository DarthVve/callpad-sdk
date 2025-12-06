import {
  RoomAudioRenderer,
  useRoomContext,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { ReactElement } from 'react';
import useRecording from './useRecording';
import { AudioOnlyLayout } from './CompositeLayout';

export function CompositeTemplate() {
  const room = useRoomContext();
  const { remoteVideoTracks, isAudioOnly } = useRecording(room);

  // determine layout to use
  let main: ReactElement = <></>;
  if (room.state !== ConnectionState.Disconnected) {
    if (!isAudioOnly) {
      main = <AudioOnlyLayout tracks={remoteVideoTracks} />
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
