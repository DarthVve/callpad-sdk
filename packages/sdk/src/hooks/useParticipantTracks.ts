import { useState, useEffect, useMemo } from 'react';
// biome-ignore lint/style/useImportType: <explanation>
import { Track } from 'livekit-client';
import { useSdk } from '../provider/RtcProvider';
import { useEvent } from './useEvent';
import { useRtcStore } from '../state/store';
import { createLogger } from '../utils/logger';
import type { TrackReference } from '../state/types';

const logger = createLogger('hooks:participant-tracks');

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

  const sourcesKey = JSON.stringify(sources);

  useEffect(() => {
    if (!livekitParticipant || !internalParticipant) {
      logger.debug('Missing participant data', { 
        participantIdentity,
        hasLivekitParticipant: !!livekitParticipant,
        hasInternalParticipant: !!internalParticipant
      });
      setTrackRefs([]);
      return;
    }

    const refs: TrackReference[] = [];
    const isLocal = livekitParticipant.isLocal;
    
    logger.debug('Building track refs', { 
      participantIdentity, 
      sources: sources.map(s => s), 
      isLocal 
    });
    
    for (const source of sources) {
      const publication = livekitParticipant.getTrackPublication(source);
      
      logger.debug('Checking track publication', {
        participantIdentity,
        source: source,
        hasPublication: !!publication,
        isSubscribed: publication?.isSubscribed,
        isMuted: publication?.isMuted,
        hasTrack: !!publication?.track,
        trackSid: publication?.trackSid,
        isLocal
      });
      
      if (publication) {
        const trackRef: TrackReference = {
          participant: internalParticipant,
          publication,
          source,
        };
        
        // Enhanced track availability checking
        if (publication.track) {
          trackRef.track = publication.track;
          logger.debug('Track available immediately', {
            participantIdentity,
            source: source,
            trackSid: publication.trackSid,
            trackKind: publication.track.kind,
            isLocal
          });
        } else if (publication.isSubscribed) {
          // Track is subscribed but track object not yet available
          logger.warn('Track subscribed but not available', {
            participantIdentity,
            source: source,
            trackSid: publication.trackSid,
            isLocal
          });
        } else {
          logger.debug('Track publication exists but not subscribed', {
            participantIdentity,
            source: source,
            trackSid: publication.trackSid,
            isLocal
          });
        }
        
        refs.push(trackRef);
      } else {
        logger.debug('No publication found', {
          participantIdentity,
          source: source,
          isLocal
        });
      }
    }

    logger.debug('Track refs built', { 
      participantIdentity, 
      refsCount: refs.length,
      tracksWithTrackObject: refs.filter(r => r.track).length,
      isLocal
    });

    setTrackRefs(refs);
  }, [livekitParticipant, internalParticipant, sourcesKey, participantIdentity]);

  useEvent('livekit:track-subscribed', (event) => {
    if (event?.payload?.participantId === participantIdentity) {
      logger.debug('Track subscribed event received', {
        participantIdentity,
        trackSid: event.payload.trackSid,
        source: event.payload.source,
        kind: event.payload.kind
      });
      
      // Force re-evaluation of track refs to pick up newly available track
      setTrackRefs(prev => {
        logger.debug('Re-evaluating track refs after subscription', {
          participantIdentity,
          currentRefsCount: prev.length
        });
        return [...prev];
      });
    }
  });

  useEvent('livekit:track-unsubscribed', (event) => {
    if (event?.payload?.participantId === participantIdentity) {
      logger.debug('Track unsubscribed event received', {
        participantIdentity,
        trackSid: event.payload.trackSid,
        kind: event.payload.kind
      });
      setTrackRefs(prev => [...prev]);
    }
  });

  useEvent('livekit:track-muted', (event) => {
    if (event?.payload?.participantId === participantIdentity) {
      logger.debug('Track muted event received', {
        participantIdentity,
        trackSid: event.payload.trackSid,
        source: event.payload.source
      });
      setTrackRefs(prev => [...prev]);
    }
  });

  useEvent('livekit:track-unmuted', (event) => {
    if (event?.payload?.participantId === participantIdentity) {
      logger.debug('Track unmuted event received', {
        participantIdentity,
        trackSid: event.payload.trackSid,
        source: event.payload.source
      });
      setTrackRefs(prev => [...prev]);
    }
  });

  // Listen for local track published events too
  useEvent('livekit:track-published', (event) => {
    if (event?.payload?.participantId === participantIdentity) {
      logger.debug('Track published event received', {
        participantIdentity,
        trackSid: event.payload.trackSid,
        source: event.payload.source,
        kind: event.payload.kind,
        isLocal: livekitParticipant?.isLocal
      });
      
      // For local tracks, we need to check if track object is immediately available
      if (livekitParticipant?.isLocal) {
        const publication = livekitParticipant.getTrackPublication(event.payload.source);
        logger.debug('Local track publication check after published event', {
          participantIdentity,
          source: event.payload.source,
          hasPublication: !!publication,
          hasTrack: !!publication?.track,
          trackSid: publication?.trackSid
        });
      }
      
      setTrackRefs(prev => [...prev]);
    }
  });

  return trackRefs;
}