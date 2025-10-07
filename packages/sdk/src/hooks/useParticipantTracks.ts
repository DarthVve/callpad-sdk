import { useState, useEffect, useMemo, useCallback } from 'react';
import { Track } from 'livekit-client';
import { useSdk } from '../provider/RtcProvider';
import { useEvent } from './useEvent';
import { useRtcStore } from '../state/store';
import type { TrackReference } from '../state/types';

export function useParticipantTracks(
  participantIdentity: string,
  sources: Track.Source[]
): TrackReference[] {
  const sdk = useSdk();
  const [trackRefs, setTrackRefs] = useState<TrackReference[]>([]);

  const livekitParticipant = useMemo(() => {
    if (!sdk.livekit?.room) return null;
    
    if (sdk.livekit.room.localParticipant.identity === participantIdentity) {
      return sdk.livekit.room.localParticipant;
    }
    
    return sdk.livekit.room.remoteParticipants.get(participantIdentity) || null;
  }, [sdk.livekit?.room, participantIdentity]);

  const internalParticipant = useRtcStore((state) => 
    state.room.participants[participantIdentity]
  );

  const updateTrackRefs = useCallback(() => {
    if (!livekitParticipant || !internalParticipant) {
      setTrackRefs([]);
      return;
    }

    const refs: TrackReference[] = [];
    
    sources.forEach(source => {
      const publication = livekitParticipant.getTrackPublication(source);
      if (publication) {
        const trackRef: TrackReference = {
          participant: internalParticipant,
          publication,
          source,
        };
        
        // Only add track property if it exists
        if (publication.track) {
          trackRef.track = publication.track;
        }
        
        refs.push(trackRef);
      }
    });

    setTrackRefs(refs);
  }, [livekitParticipant, internalParticipant, sources]);

  // Listen for track events but don't use the return value
  useEvent('livekit:track-subscribed', (event) => {
    if (event?.payload?.participantId === participantIdentity) {
      updateTrackRefs();
    }
  });

  useEvent('livekit:track-unsubscribed', (event) => {
    if (event?.payload?.participantId === participantIdentity) {
      updateTrackRefs();
    }
  });

  useEvent('livekit:track-muted', (event) => {
    if (event?.payload?.participantId === participantIdentity) {
      updateTrackRefs();
    }
  });

  useEvent('livekit:track-unmuted', (event) => {
    if (event?.payload?.participantId === participantIdentity) {
      updateTrackRefs();
    }
  });

  useEffect(() => {
    updateTrackRefs();
  }, [updateTrackRefs]);

  return trackRefs;
}