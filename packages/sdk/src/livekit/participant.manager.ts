import {
  LocalParticipant,
  type Participant,
  type Room,
  RoomEvent,
  Track,
  type TrackPublication,
} from "livekit-client";
import { rtcStore } from "../state/store";
import type { ParticipantState } from "../state/types";

export class ParticipantManager {
  constructor(private room: Room) {
    this.setupEventListeners();
    this.syncAllParticipants();
  }

  private setupEventListeners(): void {
    this.room
      .on(RoomEvent.ActiveSpeakersChanged, this.handleActiveSpeakers)
      .on(RoomEvent.ParticipantConnected, this.handleParticipantJoined)
      .on(RoomEvent.ParticipantDisconnected, this.handleParticipantLeft)
      .on(RoomEvent.TrackMuted, this.handleTrackMuted)
      .on(RoomEvent.TrackUnmuted, this.handleTrackUnmuted)
      .on(RoomEvent.TrackPublished, this.handleTrackPublished)
      .on(RoomEvent.TrackUnpublished, this.handleTrackUnpublished);
  }

  private syncAllParticipants(): void {
    const allParticipants = [
      this.room.localParticipant,
      ...Array.from(this.room.remoteParticipants.values()),
    ];

    for (const participant of allParticipants) {
      this.syncParticipantToState(participant);
    }
  }

  private handleActiveSpeakers = (speakers: Participant[]): void => {
    rtcStore.getState().patch((state) => {
      const speakerIds = new Set(speakers.map((s) => s.identity));

      for (const [participantId, participantState] of Object.entries(
        state.participants
      )) {
        participantState.isSpeaking = speakerIds.has(participantId);
      }
    });
  };

  private handleParticipantJoined = (participant: Participant): void => {
    this.syncParticipantToState(participant);
  };

  private handleParticipantLeft = (participant: Participant): void => {
    rtcStore.getState().patch((state) => {
      delete state.participants[participant.identity];
    });
  };

  private handleTrackMuted = (
    publication: TrackPublication,
    participant: Participant
  ): void => {
    this.updateParticipantMuteState(participant);
  };

  private handleTrackUnmuted = (
    publication: TrackPublication,
    participant: Participant
  ): void => {
    this.updateParticipantMuteState(participant);
  };

  private handleTrackPublished = (
    publication: TrackPublication,
    participant: Participant
  ): void => {
    this.updateParticipantMuteState(participant);
  };

  private handleTrackUnpublished = (
    publication: TrackPublication,
    participant: Participant
  ): void => {
    this.updateParticipantMuteState(participant);
  };

  private syncParticipantToState(participant: Participant): void {
    const participantState: ParticipantState = {
      id: participant.identity,
      name: participant.name || participant.identity,
      isLocal: participant instanceof LocalParticipant,
      isSpeaking: false,
      audioMuted: this.getAudioMutedState(participant),
      videoMuted: this.getVideoMutedState(participant),
      metadata: participant.metadata
        ? JSON.parse(participant.metadata)
        : undefined,
    };

    rtcStore.getState().patch((state) => {
      state.participants[participant.identity] = participantState;
    });
  }

  private updateParticipantMuteState(participant: Participant): void {
    rtcStore.getState().patch((state) => {
      const participantState = state.participants[participant.identity];
      if (participantState) {
        participantState.audioMuted = this.getAudioMutedState(participant);
        participantState.videoMuted = this.getVideoMutedState(participant);
      }
    });
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

  destroy(): void {
    this.room
      .off(RoomEvent.ActiveSpeakersChanged, this.handleActiveSpeakers)
      .off(RoomEvent.ParticipantConnected, this.handleParticipantJoined)
      .off(RoomEvent.ParticipantDisconnected, this.handleParticipantLeft)
      .off(RoomEvent.TrackMuted, this.handleTrackMuted)
      .off(RoomEvent.TrackUnmuted, this.handleTrackUnmuted)
      .off(RoomEvent.TrackPublished, this.handleTrackPublished)
      .off(RoomEvent.TrackUnpublished, this.handleTrackUnpublished);
  }
}
