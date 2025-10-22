import { Participant, Track } from "livekit-client";

/**
 * Check if a participant has video enabled and published
 */
export function hasVideoTrack(participant: Participant): boolean {
  const videoTrack = participant.getTrackPublication(Track.Source.Camera);
  return videoTrack !== undefined && !videoTrack.isMuted;
}

/**
 * Get video track from participant 
 */
export function getVideoTrack(participant: Participant) {
  return participant.getTrackPublication(Track.Source.Camera);
}

/**
 * Check if participant has video capability (track exists, may be muted)
 */
export function hasVideoCapability(participant: Participant): boolean {
  return participant.getTrackPublication(Track.Source.Camera) !== undefined;
}