import { useState, useEffect, useCallback } from 'react';
import { useSdk } from '../provider/RtcProvider';

export interface AudioPlaybackState {
  canPlayback: boolean;
  isStarting: boolean;
  lastAttempt: number | null;
}

/**
 * Hook for managing audio playback status and user interaction requirements
 * 
 * This hook monitors LiveKit's audio playback status and provides methods
 * to handle browser autoplay restrictions according to LiveKit best practices.
 */
export function useAudioPlayback() {
  const sdk = useSdk();
  const [state, setState] = useState<AudioPlaybackState>({
    canPlayback: false,
    isStarting: false,
    lastAttempt: null,
  });

  // Update state when SDK becomes available
  useEffect(() => {
    if (!sdk.livekit) return;

    setState(prev => ({
      ...prev,
      canPlayback: sdk.livekit.canPlaybackAudio,
    }));
  }, [sdk.livekit]);

  /**
   * Attempts to start audio playback (must be called from user interaction)
   * Returns true if successful, false if still requires interaction
   */
  const startAudio = useCallback(async (): Promise<boolean> => {
    if (!sdk.livekit) {
      return false;
    }

    setState(prev => ({ ...prev, isStarting: true }));

    try {
      const success = await sdk.livekit.startAudioWithUserInteraction();
      
      setState(prev => ({
        ...prev,
        isStarting: false,
        canPlayback: sdk.livekit.canPlaybackAudio,
        lastAttempt: Date.now(),
      }));

      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isStarting: false,
        lastAttempt: Date.now(),
      }));
      return false;
    }
  }, [sdk.livekit]);

  /**
   * Check if audio needs user interaction to start
   */
  const needsUserInteraction = !state.canPlayback && sdk.livekit !== null;

  return {
    /**
     * Current audio playback state
     */
    state,
    
    /**
     * Whether audio playback needs user interaction to start
     */
    needsUserInteraction,
    
    /**
     * Whether audio is currently being started
     */
    isStarting: state.isStarting,
    
    /**
     * Attempt to start audio playback (call from click/tap handler)
     */
    startAudio,
    
    /**
     * Current audio playback capability status
     */
    canPlayback: state.canPlayback,
  };
}