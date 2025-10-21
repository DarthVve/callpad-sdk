import { type RemoteParticipant, type Room, RoomEvent } from "livekit-client";
import { profileCache } from "../state/profileCache";
import { rtcStore } from "../state/store";
import { createLogger } from "../utils";

const logger = createLogger("livekitRoomManager");

export class LiveKitRoomManager {
  private room: Room | undefined;

  attach(room: Room): void {
    if (this.room === room) {
      logger.debug("Already attached to this room");
      return;
    }

    this.detach();
    this.room = room;

    logger.info("Attaching to LiveKit room");
    room.on(
      RoomEvent.ParticipantDisconnected,
      this.handleParticipantDisconnected
    );
    room.on(RoomEvent.Disconnected, this.handleRoomDisconnected);
  }

  detach(): void {
    if (!this.room) {
      return;
    }

    logger.info("Detaching from LiveKit room");
    this.room.off(
      RoomEvent.ParticipantDisconnected,
      this.handleParticipantDisconnected
    );
    this.room.off(RoomEvent.Disconnected, this.handleRoomDisconnected);
    this.room = undefined;
  }

  async disconnect(): Promise<void> {
    if (this.room) {
      logger.info("Disconnecting from LiveKit room");
      await this.room.disconnect().catch((error) => {
        logger.error("Error disconnecting from room", error);
      });
    }

    this.detach();
    rtcStore.getState().reset();
    profileCache.getState().clear();
  }

  private handleParticipantDisconnected = (participant: RemoteParticipant) => {
    if (!this.room) {
      return;
    }

    const remoteCount = this.room.remoteParticipants.size;
    logger.debug("Participant disconnected", {
      participantId: participant.identity,
      remoteCount,
    });

    if (remoteCount === 0) {
      const session = rtcStore.getState().session;
      if (!session || session.status === "ended") {
        logger.debug("Session already ended, skipping auto-disconnect");
        return;
      }

      logger.info("Last remote participant left, disconnecting");
      this.disconnect().catch((error) => {
        logger.error("Error disconnecting from LiveKit room", error);
      });
    }
  };

  private handleRoomDisconnected = () => {
    logger.info("Room disconnected");
    this.detach();
  };
}
