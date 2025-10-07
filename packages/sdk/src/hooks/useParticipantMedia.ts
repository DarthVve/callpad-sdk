import { useMemo } from 'react';
import { Track, type RemoteTrack, type LocalTrack } from 'livekit-client';
import { useParticipantTracks } from './useParticipantTracks';

export interface ParticipantMediaTracks {
  camera: RemoteTrack | LocalTrack | undefined;
  microphone: RemoteTrack | LocalTrack | undefined;
  screenShare: RemoteTrack | LocalTrack | undefined;
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasScreenShare: boolean;
}

/**
 * Hook to get all media tracks for a specific participant
 * Returns LiveKit track objects that can be used with track.attach()
 */
export function useParticipantMedia(participantId: string): ParticipantMediaTracks {
  // Get track references for camera, microphone, and screen share
  const trackRefs = useParticipantTracks(participantId, [
    Track.Source.Camera,
    Track.Source.Microphone,
    Track.Source.ScreenShare,
  ]);

  return useMemo(() => {
    const cameraTrackRef = trackRefs.find(ref => ref.source === Track.Source.Camera);
    const microphoneTrackRef = trackRefs.find(ref => ref.source === Track.Source.Microphone);
    const screenShareTrackRef = trackRefs.find(ref => ref.source === Track.Source.ScreenShare);

    // Return LiveKit track objects for proper attach() usage (cast to specific types)
    const camera = cameraTrackRef?.track as (RemoteTrack | LocalTrack) | undefined;
    const microphone = microphoneTrackRef?.track as (RemoteTrack | LocalTrack) | undefined;
    const screenShare = screenShareTrackRef?.track as (RemoteTrack | LocalTrack) | undefined;

    return {
      camera,
      microphone,
      screenShare,
      hasCamera: !!camera && !cameraTrackRef?.publication.isMuted,
      hasMicrophone: !!microphone && !microphoneTrackRef?.publication.isMuted,
      hasScreenShare: !!screenShare && !screenShareTrackRef?.publication.isMuted,
    };
  }, [trackRefs]);
}

/**
 * Convenience hook to get just the video track for a participant
 */
export function useParticipantVideoTrack(participantId: string): RemoteTrack | LocalTrack | undefined {
  const { camera } = useParticipantMedia(participantId);
  return camera;
}

/**
 * Convenience hook to get just the audio track for a participant
 */
export function useParticipantAudioTrack(participantId: string): RemoteTrack | LocalTrack | undefined {
  const { microphone } = useParticipantMedia(participantId);
  return microphone;
}