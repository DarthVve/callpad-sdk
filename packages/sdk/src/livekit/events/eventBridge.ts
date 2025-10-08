// biome-ignore lint/style/useImportType: <explanation>
import {
  LocalParticipant,
  type Participant,
  type Room,
  RoomEvent,
  Track,
  type TrackPublication,
} from "livekit-client";
import { eventBus } from "../../core/events";
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
      "livekit:track-unsubscribed" as any,
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
      "livekit:track-muted" as any,
      {
        participantId: pid,
        trackSid,
        kind: publication.kind,
        source: publication.source,
        timestamp: Date.now(),
      },
      "livekit"
    );

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
      "livekit:track-unmuted" as any,
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
      "livekit:track-published" as any,
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

    // Remove from the track registry
    trackRegistry.remove(trackSid);

    // Emit SDK event for local track unpublished
    eventBus.emit(
      "livekit:track-unpublished" as any,
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
}
