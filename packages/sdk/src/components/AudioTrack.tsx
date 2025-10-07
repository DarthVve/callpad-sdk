"use client";

import { useEffect, useRef } from 'react';
import type { RemoteTrack, LocalTrack } from 'livekit-client';
import { useParticipantMedia } from '../hooks/useParticipantMedia';
import type { TrackReference } from '../state/types';
import { createLogger } from '../utils/logger';

const logger = createLogger('components:AudioTrack');

export interface AudioTrackProps {
  /**
   * Track reference containing the audio track to render
   */
  trackRef?: TrackReference;
  
  /**
   * Participant ID to get audio track from (alternative to trackRef)
   */
  participantId?: string;
  
  /**
   * Volume level (0.0 to 1.0)
   * @default 1.0
   */
  volume?: number;
  
  /**
   * Whether to mute the audio track
   * @default false
   */
  muted?: boolean;
  
  /**
   * Callback when subscription status changes
   */
  onSubscriptionStatusChanged?: (subscribed: boolean) => void;
}

/**
 * AudioTrack component for rendering participant audio tracks
 * 
 * Follows the same API as LiveKit's official React components.
 * Automatically handles track attachment, volume control, and cleanup.
 * 
 * Note: Local audio tracks are not rendered to prevent audio feedback.
 */
export function AudioTrack({
  trackRef,
  participantId,
  volume = 1.0,
  muted = false,
  onSubscriptionStatusChanged,
}: AudioTrackProps) {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  // Get track from participant if participantId provided
  const participantMedia = useParticipantMedia(participantId || '');
  
  // Resolve the actual track to use
  const resolvedTrack = trackRef?.track || (participantId ? participantMedia.microphone : undefined);
  const resolvedTrackRef = trackRef || (participantId ? {
    participant: null,
    publication: null,
    source: null,
    track: participantMedia.microphone,
  } : undefined);
  
  // Check if this is a local track (don't render local audio to prevent feedback)
  const isLocalTrack = resolvedTrack && 'isLocal' in resolvedTrack && resolvedTrack.isLocal;
  
  // Only render if we have a track and it's not local
  const shouldRender = resolvedTrack && !isLocalTrack;
  
  // Handle track attachment and detachment
  useEffect(() => {
    if (!shouldRender || !resolvedTrack) {
      return undefined;
    }
    
    let audioElement: HTMLAudioElement | null = null;
    
    try {
      // Attach the track to create audio element
      const element = resolvedTrack.attach();
      audioElement = element as HTMLAudioElement;
      audioElementRef.current = audioElement;
      
      // Configure audio element for optimal browser compatibility
      audioElement.autoplay = true;
      audioElement.controls = false;
      audioElement.style.display = 'none';
      audioElement.style.position = 'absolute';
      audioElement.style.pointerEvents = 'none';
      audioElement.style.zIndex = '-1';
      
      // Apply initial volume and mute settings
      audioElement.volume = muted ? 0 : Math.max(0, Math.min(1, volume));
      
      // Add error handling
      const handleAudioError = (event: Event) => {
        logger.warn('Audio playback error', {
          participantId,
          trackSid: resolvedTrackRef?.publication?.trackSid,
          error: event
        });
      };
      
      const handleCanPlay = () => {
        logger.debug('Audio track ready for playback', {
          participantId,
          trackSid: resolvedTrackRef?.publication?.trackSid
        });
      };
      
      const handleLoadedMetadata = () => {
        logger.debug('Audio track metadata loaded', {
          participantId,
          trackSid: resolvedTrackRef?.publication?.trackSid,
          duration: audioElement?.duration
        });
      };
      
      // Add event listeners
      audioElement.addEventListener('error', handleAudioError);
      audioElement.addEventListener('canplay', handleCanPlay);
      audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      // Append to document body (hidden)
      document.body.appendChild(audioElement);
      
      logger.debug('Audio track attached', {
        participantId,
        trackSid: resolvedTrackRef?.publication?.trackSid,
        volume: audioElement.volume,
        muted
      });
      
      // Notify subscription status if callback provided
      if (onSubscriptionStatusChanged) {
        const isSubscribed = resolvedTrackRef?.publication?.isSubscribed ?? true;
        onSubscriptionStatusChanged(isSubscribed);
      }
      
      // Cleanup function
      return () => {
        if (audioElement) {
          logger.debug('Cleaning up audio track', {
            participantId,
            trackSid: resolvedTrackRef?.publication?.trackSid
          });
          
          // Remove event listeners
          audioElement.removeEventListener('error', handleAudioError);
          audioElement.removeEventListener('canplay', handleCanPlay);
          audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
          
          // Detach track
          try {
            resolvedTrack.detach(audioElement);
          } catch (detachError) {
            logger.warn('Failed to detach audio track', {
              participantId,
              trackSid: resolvedTrackRef?.publication?.trackSid,
              error: detachError
            });
          }
          
          // Remove from DOM
          if (audioElement.parentNode) {
            audioElement.parentNode.removeChild(audioElement);
          }
          
          audioElementRef.current = null;
        }
      };
    } catch (error) {
      logger.error('Failed to attach audio track', {
        participantId,
        trackSid: resolvedTrackRef?.publication?.trackSid,
        error
      });
      
      // Cleanup on error
      if (audioElement) {
        try {
          resolvedTrack.detach(audioElement);
        } catch (detachError) {
          logger.warn('Failed to detach audio element after error', {
            error: detachError
          });
        }
        
        if (audioElement.parentNode) {
          audioElement.parentNode.removeChild(audioElement);
        }
      }
      
      return undefined;
    }
  }, [shouldRender, resolvedTrack, participantId, resolvedTrackRef, onSubscriptionStatusChanged]);
  
  // Update volume when prop changes
  useEffect(() => {
    if (audioElementRef.current && !muted) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      audioElementRef.current.volume = clampedVolume;
      
      logger.debug('Audio volume updated', {
        participantId,
        volume: clampedVolume
      });
    }
  }, [volume, muted, participantId]);
  
  // Update mute state when prop changes
  useEffect(() => {
    if (audioElementRef.current) {
      const targetVolume = muted ? 0 : Math.max(0, Math.min(1, volume));
      audioElementRef.current.volume = targetVolume;
      
      logger.debug('Audio mute state updated', {
        participantId,
        muted,
        volume: targetVolume
      });
    }
  }, [muted, volume, participantId]);
  
  // Log when component would not render
  useEffect(() => {
    if (!resolvedTrack) {
      logger.debug('No audio track available', { participantId });
    } else if (isLocalTrack) {
      logger.debug('Skipping local audio track to prevent feedback', { participantId });
    }
  }, [resolvedTrack, isLocalTrack, participantId]);
  
  // This component renders nothing visible (audio is handled via hidden DOM elements)
  return null;
}