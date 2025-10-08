// biome-ignore lint/style/useImportType: <explanation>
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
  appId?: string;
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

      .on(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed)
      .on(RoomEvent.TrackMuted, this.handleTrackMuted)
      .on(RoomEvent.TrackUnmuted, this.handleTrackUnmuted)

      // Local track events
      .on(RoomEvent.LocalTrackPublished, this.handleLocalTrackPublished)
      .on(RoomEvent.LocalTrackUnpublished, this.handleLocalTrackUnpublished)

      // Media events
      .on(RoomEvent.ActiveSpeakersChanged, this.handleActiveSpeakersChanged)
      .on(
        RoomEvent.ConnectionQualityChanged,
        this.handleConnectionQualityChanged
      );
  }

  private handleConnected = async (): Promise<void> => {
    this.opts.log?.("info", "LiveKit room connected");

    rtcStore.getState().patch((state) => {
      state.connection.connected = true;
      state.connection.reconnecting = false;
    });

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

    // Emit SDK event for track unsubscription
    eventBus.emit(
      'livekit:track-unsubscribed' as any,
      {
        participantId: pid,
        trackSid,
        kind: track.kind,
        timestamp: Date.now(),
      },
      "livekit"
    );
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

    // Emit SDK event for track muted
    eventBus.emit(
      'livekit:track-muted' as any,
      {
        participantId: pid,
        trackSid,
        kind: publication.kind,
        source: publication.source,
        timestamp: Date.now(),
      },
      "livekit"
    );

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

    // Emit SDK event for track unmuted
    eventBus.emit(
      'livekit:track-unmuted' as any,
      {
        participantId: pid,
        trackSid,
        kind: publication.kind,
        source: publication.source,
        timestamp: Date.now(),
      },
      "livekit"
    );

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

  private handleLocalTrackPublished = (
    publication: TrackPublication,
    participant: LocalParticipant
  ): void => {
    const pid = participant.identity;
    const trackSid = publication.trackSid;

    this.opts.log?.("debug", "Local track published", {
      pid,
      trackSid,
      kind: publication.kind,
      source: publication.source,
    });

    trackRegistry.add(trackSid, pid, publication.kind, publication.source);

    // Emit SDK event for local track published
    eventBus.emit(
      'livekit:track-published' as any,
      {
        participantId: pid,
        trackSid,
        kind: publication.kind,
        source: publication.source,
        timestamp: Date.now(),
      },
      "livekit"
    );

  };

  private handleLocalTrackUnpublished = (
    publication: TrackPublication,
    participant: LocalParticipant
  ): void => {
    const pid = participant.identity;
    const trackSid = publication.trackSid;

    this.opts.log?.("debug", "Local track unpublished", {
      pid,
      trackSid,
      kind: publication.kind,
      source: publication.source,
    });

    // Remove from track registry
    trackRegistry.remove(trackSid);

    // Emit SDK event for local track unpublished
    eventBus.emit(
      'livekit:track-unpublished' as any,
      {
        participantId: pid,
        trackSid,
        kind: publication.kind,
        source: publication.source,
        timestamp: Date.now(),
      },
      "livekit"
    );
  };

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
      .off(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed)
      .off(RoomEvent.TrackMuted, this.handleTrackMuted)
      .off(RoomEvent.TrackUnmuted, this.handleTrackUnmuted)
      .off(RoomEvent.LocalTrackPublished, this.handleLocalTrackPublished)
      .off(RoomEvent.LocalTrackUnpublished, this.handleLocalTrackUnpublished)
      .off(RoomEvent.ActiveSpeakersChanged, this.handleActiveSpeakersChanged)
      .off(
        RoomEvent.ConnectionQualityChanged,
        this.handleConnectionQualityChanged
      );
  }
}
