import { Track } from "livekit-client";

interface TrackState {
  sid: string;
  participantId: string;
  kind: "audio" | "video" | "screen";
}

export class TrackRegistry {
  private tracks: Record<string, TrackState> = {};

  /**
   * Add or update a track in the registry
   * Idempotent: safe to call multiple times with same params
   */
  add(
    sid: string,
    participantId: string,
    kind: Track.Kind,
    source?: Track.Source
  ): void {
    this.tracks[sid] = {
      sid,
      participantId,
      kind: source ? this.mapTrackSource(source) : this.mapTrackKind(kind),
    };
  }

  /**
   * Remove a track from the registry
   * Idempotent: ignores unknown sids
   */
  remove(sid: string): void {
    delete this.tracks[sid];
  }

  /**
   * Remove all tracks for a specific participant
   * Used when participant disconnects
   */
  removeByParticipant(participantId: string): void {
    const tracksToRemove: string[] = [];

    for (const [sid, track] of Object.entries(this.tracks)) {
      if (track.participantId === participantId) {
        tracksToRemove.push(sid);
      }
    }

    for (const sid of tracksToRemove) {
      delete this.tracks[sid];
    }
  }

  /**
   * Get all tracks for a specific participant
   */
  getByParticipant(participantId: string): TrackState[] {
    return Object.values(this.tracks).filter(
      (track) => track.participantId === participantId
    );
  }

  /**
   * Get all tracks
   */
  getAll(): TrackState[] {
    return Object.values(this.tracks);
  }

  /**
   * Clear all tracks
   */
  clear(): void {
    this.tracks = {};
  }

  /**
   * Map LiveKit Track.Kind to our TrackState kind
   * Note: This is deprecated - use mapTrackSource for better accuracy
   */
  private mapTrackKind(kind: Track.Kind): "audio" | "video" | "screen" {
    switch (kind) {
      case Track.Kind.Audio:
        return "audio";
      case Track.Kind.Video:
        return "video";
      default:
        // Fallback for unknown kinds
        return "video";
    }
  }

  /**
   * Map LiveKit Track.Source to our TrackState kind (more accurate)
   */
  private mapTrackSource(source: Track.Source): "audio" | "video" | "screen" {
    switch (source) {
      case Track.Source.Microphone:
        return "audio";
      case Track.Source.Camera:
        return "video";
      case Track.Source.ScreenShare:
      case Track.Source.ScreenShareAudio:
        return "screen";
      default:
        // Fallback to generic video for unknown sources
        return "video";
    }
  }
}

// Singleton instance
export const trackRegistry = new TrackRegistry();
