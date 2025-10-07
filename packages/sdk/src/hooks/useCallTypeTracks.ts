import { useEffect } from 'react';
import { Track } from 'livekit-client';
import { useCallState } from './useCallState';
import { useMediaControls } from './useMediaControls';
import { createLogger } from '../utils/logger';

const logger = createLogger('hooks:call-type-tracks');

export interface CallTypeTracksConfig {
  enableCameraOnVideoCall?: boolean;
  enableMicrophoneOnCall?: boolean;
  disableTracksOnCallEnd?: boolean;
}

/**
 * Hook to manage tracks based on call type and state
 * Automatically enables/disables appropriate tracks based on call type
 */
export function useCallTypeTracks(config: CallTypeTracksConfig = {}) {
  const { 
    enableCameraOnVideoCall = true,
    enableMicrophoneOnCall = true,
    disableTracksOnCallEnd = true
  } = config;

  const { status, mode } = useCallState();
  const { 
    enableCamera, 
    disableCamera, 
    enableMicrophone, 
    disableMicrophone,
    isConnected 
  } = useMediaControls();

  // Handle track setup based on call state and type
  useEffect(() => {
    if (!isConnected) return;

    const handleTrackSetup = async () => {
      try {
        // When call becomes active, set up tracks based on call type
        if (status === 'ACTIVE') {
          logger.info('Setting up tracks for active call', { mode });

          if (enableMicrophoneOnCall) {
            await enableMicrophone();
          }

          if (mode === 'VIDEO' && enableCameraOnVideoCall) {
            await enableCamera();
          } else if (mode === 'AUDIO') {
            // For audio calls, ensure camera is disabled
            await disableCamera();
          }
        }

        // Clean up tracks when call ends
        if (status === 'ENDED' || status === 'IDLE') {
          if (disableTracksOnCallEnd) {
            logger.info('Cleaning up tracks after call end');
            await disableCamera();
            await disableMicrophone();
          }
        }
      } catch (error) {
        logger.error('Failed to setup tracks for call type', { error, status, mode });
      }
    };

    handleTrackSetup();
  }, [
    status, 
    mode, 
    isConnected,
    enableCamera,
    disableCamera,
    enableMicrophone,
    disableMicrophone,
    enableCameraOnVideoCall,
    enableMicrophoneOnCall,
    disableTracksOnCallEnd
  ]);

  return {
    callType: mode,
    callStatus: status,
    isConnected,
    shouldHaveVideo: mode === 'VIDEO',
    shouldHaveAudio: true, // Both audio and video calls have audio
  };
}