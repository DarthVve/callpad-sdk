import {
  ConnectionQuality,
  LocalParticipant,
  type Participant,
  type Room,
  RoomEvent,
  Track,
  type TrackPublication,
} from "livekit-client";
import { SdkEventType, eventBus } from "../../core/events";
import { rtcStore } from "../../state/store";
import { trackRegistry } from "./trackRegistry";

export interface EventBridgeOptions {
  log?: (
    lvl: "debug" | "info" | "warn" | "error",
    msg: string,
    extra?: any
  ) => void;
}

export class LiveKitEventBridge {
  private room: Room;
  private opts: EventBridgeOptions;

  constructor(room: Room, opts: EventBridgeOptions = {}) {
    this.room = room;
    this.opts = opts;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.room
      // Connection events
      .on(RoomEvent.Connected, this.handleConnected)
      .on(RoomEvent.Disconnected, this.handleDisconnected)
      .on(RoomEvent.Reconnecting, this.handleReconnecting)
      .on(RoomEvent.Reconnected, this.handleReconnected)

      // Participant events
      .on(RoomEvent.ParticipantConnected, this.handleParticipantConnected)
      .on(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected)

      // Track events
      .on(RoomEvent.TrackSubscribed, this.handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed)
      .on(RoomEvent.TrackMuted, this.handleTrackMuted)
      .on(RoomEvent.TrackUnmuted, this.handleTrackUnmuted)

      // Media events
      .on(RoomEvent.ActiveSpeakersChanged, this.handleActiveSpeakersChanged)
      .on(
        RoomEvent.ConnectionQualityChanged,
        this.handleConnectionQualityChanged
      );
  }

  private handleConnected = (): void => {
    this.opts.log?.("info", "LiveKit room connected");

    rtcStore.getState().patch((state) => {
      state.connection.connected = true;
      state.connection.reconnecting = false;
    });

    // Sync all existing participants (including local)
    this.syncAllParticipants();
  };

  private handleDisconnected = (): void => {
    this.opts.log?.("info", "LiveKit room disconnected");

    rtcStore.getState().patch((state) => {
      state.connection.connected = false;
      state.connection.reconnecting = false;
    });
  };

  private handleReconnecting = (): void => {
    this.opts.log?.("info", "LiveKit room reconnecting");

    rtcStore.getState().patch((state) => {
      state.connection.reconnecting = true;
    });
  };

  private handleReconnected = (): void => {
    this.opts.log?.("info", "LiveKit room reconnected");

    rtcStore.getState().patch((state) => {
      state.connection.connected = true;
      state.connection.reconnecting = false;
    });
  };

  private handleParticipantConnected = (participant: Participant): void => {
    const pid = participant.identity;
    this.opts.log?.("info", "Participant connected", { pid });

    rtcStore.getState().patch((state) => {
      // Create or update participant in unified state
      if (!state.room.participants[pid]) {
        state.room.participants[pid] = {
          id: pid,
          firstName: participant.name || "Unknown",
          role: "MEMBER",
          callState: "JOINED",
          joinedAt: Date.now(),
          audioEnabled: true,
          videoEnabled: true,
          isSpeaking: false,
        };
        this.opts.log?.("debug", "Created participant", { pid });
      } else {
        // Update existing participant
        state.room.participants[pid].callState = "JOINED";
        if (!state.room.participants[pid].joinedAt) {
          state.room.participants[pid].joinedAt = Date.now();
        }
      }
    });
  };

  private handleParticipantDisconnected = (participant: Participant): void => {
    const pid = participant.identity;
    this.opts.log?.("info", "Participant disconnected", { pid });

    // Simple strategy: don't immediately mark as left, rely on call.ended
    // This handles transient disconnects gracefully

    rtcStore.getState().patch((state) => {
      // Clean up tracks for this participant
      trackRegistry.removeByParticipant(pid);

      // Keep profile and presence for history - UI can filter as needed
    });
  };

  private handleTrackSubscribed = (
    track: Track,
    publication: TrackPublication,
    participant: Participant
  ): void => {
    const pid = participant.identity;
    const trackSid = publication.trackSid;

    this.opts.log?.("debug", "Track subscribed", {
      pid,
      trackSid,
      kind: track.kind,
      source: publication.source,
    });

    // Add to track registry
    trackRegistry.add(trackSid, pid, track.kind, publication.source);

    // Update participant mute states (for backward compatibility)
    this.updateParticipantMuteState(participant);
  };

  private handleTrackUnsubscribed = (
    track: Track,
    publication: TrackPublication,
    participant: Participant
  ): void => {
    const pid = participant.identity;
    const trackSid = publication.trackSid;

    this.opts.log?.("debug", "Track unsubscribed", {
      pid,
      trackSid,
      kind: track.kind,
    });

    // Remove from track registry
    trackRegistry.remove(trackSid);

    // Update participant mute states (for backward compatibility)
    this.updateParticipantMuteState(participant);
  };

  private handleTrackMuted = (
    publication: TrackPublication,
    participant: Participant
  ): void => {
    const pid = participant.identity;
    const trackSid = publication.trackSid;

    this.opts.log?.("debug", "Track muted", {
      pid,
      trackSid,
      kind: publication.kind,
      source: publication.source,
    });

    // Update participant mute states
    this.updateParticipantMuteState(participant);

    // Update local state if it's our own track
    if (participant.isLocal) {
      rtcStore.getState().patch((state) => {
        if (publication.source === Track.Source.Microphone) {
          state.local.audioEnabled = false;
        } else if (publication.source === Track.Source.Camera) {
          state.local.videoEnabled = false;
        } else if (publication.source === Track.Source.ScreenShare) {
          state.local.screenEnabled = false;
        }
      });
    }
  };

  private handleTrackUnmuted = (
    publication: TrackPublication,
    participant: Participant
  ): void => {
    const pid = participant.identity;
    const trackSid = publication.trackSid;

    this.opts.log?.("debug", "Track unmuted", {
      pid,
      trackSid,
      kind: publication.kind,
      source: publication.source,
    });

    // Update participant mute states
    this.updateParticipantMuteState(participant);

    // Update local state if it's our own track
    if (participant.isLocal) {
      rtcStore.getState().patch((state) => {
        if (publication.source === Track.Source.Microphone) {
          state.local.audioEnabled = true;
        } else if (publication.source === Track.Source.Camera) {
          state.local.videoEnabled = true;
        } else if (publication.source === Track.Source.ScreenShare) {
          state.local.screenEnabled = true;
        }
      });
    }
  };

  private handleActiveSpeakersChanged = (speakers: Participant[]): void => {
    const speakerIds = new Set(speakers.map((s) => s.identity));

    this.opts.log?.("debug", "Active speakers changed", {
      speakers: Array.from(speakerIds),
    });

    rtcStore.getState().patch((state) => {
      // Update speaking state for all participants
      for (const [pid, participant] of Object.entries(
        state.room.participants
      )) {
        participant.isSpeaking = speakerIds.has(pid);
      }
    });
  };

  private handleConnectionQualityChanged = (
    quality: ConnectionQuality,
    participant: Participant
  ): void => {
    const pid = participant.identity;
    const qualityLabel = this.mapConnectionQuality(quality);

    this.opts.log?.("debug", "Connection quality changed", {
      pid,
      quality: qualityLabel,
    });

    rtcStore.getState().patch((state) => {
      // Update participant connection quality in unified state
      if (state.room.participants[pid]) {
        state.room.participants[pid].connectionQuality = qualityLabel;
      }

      // Update local connection quality if it's the local participant
      if (participant.isLocal) {
        state.connection.quality = qualityLabel;
      }
    });

    // Emit SDK event for connection quality change
    eventBus.emit(
      SdkEventType.CONNECTION_QUALITY_CHANGED,
      {
        participantId: pid,
        quality: qualityLabel,
        timestamp: Date.now(),
      },
      "livekit"
    );
  };

  private syncAllParticipants(): void {
    const allParticipants = [
      this.room.localParticipant,
      ...Array.from(this.room.remoteParticipants.values()),
    ];

    for (const participant of allParticipants) {
      this.handleParticipantConnected(participant);
    }
  }

  private updateParticipantMuteState(participant: Participant): void {
    // Media mute state will be tracked via track subscription/unsubscription events
    // No need to maintain separate mute state in the new architecture
  }

  private getAudioMutedState(participant: Participant): boolean {
    const audioPublication = participant.getTrackPublication(
      Track.Source.Microphone
    );
    return (
      !audioPublication ||
      audioPublication.isMuted ||
      !audioPublication.isEnabled
    );
  }

  private getVideoMutedState(participant: Participant): boolean {
    const videoPublication = participant.getTrackPublication(
      Track.Source.Camera
    );
    return (
      !videoPublication ||
      videoPublication.isMuted ||
      !videoPublication.isEnabled
    );
  }

  private mapConnectionQuality(
    quality: ConnectionQuality
  ): "excellent" | "good" | "poor" | "lost" {
    switch (quality) {
      case ConnectionQuality.Excellent:
        return "excellent";
      case ConnectionQuality.Good:
        return "good";
      case ConnectionQuality.Poor:
        return "poor";
      default:
        return "lost";
    }
  }

  destroy(): void {
    this.room
      .off(RoomEvent.Connected, this.handleConnected)
      .off(RoomEvent.Disconnected, this.handleDisconnected)
      .off(RoomEvent.Reconnecting, this.handleReconnecting)
      .off(RoomEvent.Reconnected, this.handleReconnected)
      .off(RoomEvent.ParticipantConnected, this.handleParticipantConnected)
      .off(
        RoomEvent.ParticipantDisconnected,
        this.handleParticipantDisconnected
      )
      .off(RoomEvent.TrackSubscribed, this.handleTrackSubscribed)
      .off(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed)
      .off(RoomEvent.TrackMuted, this.handleTrackMuted)
      .off(RoomEvent.TrackUnmuted, this.handleTrackUnmuted)
      .off(RoomEvent.ActiveSpeakersChanged, this.handleActiveSpeakersChanged)
      .off(
        RoomEvent.ConnectionQualityChanged,
        this.handleConnectionQualityChanged
      );
  }
}
