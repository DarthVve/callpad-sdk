import { ConnectionState, type Room } from "livekit-client";
import { useRtcStore } from "../../state/store";
import type { ParticipantMetadata } from "../../state/types";
import { createLogger } from "../../utils";
import { applyIncomingRaiseHand, useRaiseHandStore } from "./store";
import type { RaiseHandEnvelope } from "./types";

const logger = createLogger("raise-hand");

export class RaiseHandService {
  private readonly room: Room;
  private isSubscribed = false;

  constructor(room: Room) {
    this.room = room;
  }

  private isRoomReady(): boolean {
    if (!this.room) {
      logger.warn("Room not initialized");
      return false;
    }

    if (this.room.state !== ConnectionState.Connected) {
      logger.warn("Room not connected", { state: this.room.state });
      return false;
    }

    if (!this.room.localParticipant) {
      logger.warn("Local participant not available");
      return false;
    }

    return true;
  }

  subscribe(): void {
    if (this.isSubscribed) return;

    this.room.registerTextStreamHandler("raise-hand:v1", async (reader) => {
      try {
        const text = await reader.readAll();
        this.handleIncoming(text);
      } catch (err) {
        logger.error("Error reading raise-hand stream", err);
      }
    });

    this.isSubscribed = true;
    logger.info("RaiseHandService subscribed");
  }

  unsubscribe(): void {
    this.isSubscribed = false;
    logger.info("RaiseHandService unsubscribed");
  }

  getLocalParticipantId(): string {
    return this.room.localParticipant.identity;
  }

  async raiseHand(): Promise<void> {
    if (!this.isRoomReady()) {
      useRtcStore.getState().addError({
        code: "RAISE_HAND_ROOM_NOT_READY",
        message: "Cannot raise hand: room not connected",
        timestamp: Date.now(),
      });
      return;
    }

    const senderInfo = this.getSenderInfo();
    useRaiseHandStore.getState().raiseHand(senderInfo.id);

    try {
      const envelope: RaiseHandEnvelope = {
        v: 1,
        kind: "raise-hand",
        roomId: this.room.name,
        ts: Date.now(),
        sender: senderInfo,
        payload: {
          action: "raise",
        },
      };

      await this.room.localParticipant.sendText(JSON.stringify(envelope), {
        topic: "raise-hand:v1",
      });

      logger.debug("Hand raised");
    } catch (error) {
      logger.error("Failed to raise hand", error);
      useRtcStore.getState().addError({
        code: "RAISE_HAND_SEND_FAILED",
        message:
          error instanceof Error ? error.message : "Failed to raise hand",
        timestamp: Date.now(),
      });
    }
  }

  async lowerHand(targetId?: string): Promise<void> {
    if (!this.isRoomReady()) {
      useRtcStore.getState().addError({
        code: "LOWER_HAND_ROOM_NOT_READY",
        message: "Cannot lower hand: room not connected",
        timestamp: Date.now(),
      });
      return;
    }

    const senderInfo = this.getSenderInfo();
    const participantId = targetId || senderInfo.id;
    useRaiseHandStore.getState().lowerHand(participantId);

    try {
      const envelope: RaiseHandEnvelope = {
        v: 1,
        kind: "raise-hand",
        roomId: this.room.name,
        ts: Date.now(),
        sender: senderInfo,
        payload: {
          action: "lower",
          targetId: participantId,
        },
      };

      await this.room.localParticipant.sendText(JSON.stringify(envelope), {
        topic: "raise-hand:v1",
      });

      logger.debug("Hand lowered", { targetId: participantId });
    } catch (error) {
      logger.error("Failed to lower hand", error);
      useRtcStore.getState().addError({
        code: "LOWER_HAND_SEND_FAILED",
        message:
          error instanceof Error ? error.message : "Failed to lower hand",
        timestamp: Date.now(),
      });
    }
  }

  async lowerAllHands(): Promise<void> {
    if (!this.isRoomReady()) {
      useRtcStore.getState().addError({
        code: "LOWER_ALL_HANDS_ROOM_NOT_READY",
        message: "Cannot lower all hands: room not connected",
        timestamp: Date.now(),
      });
      return;
    }

    const senderInfo = this.getSenderInfo();
    useRaiseHandStore.getState().lowerAllHands();

    try {
      const envelope: RaiseHandEnvelope = {
        v: 1,
        kind: "raise-hand",
        roomId: this.room.name,
        ts: Date.now(),
        sender: senderInfo,
        payload: {
          action: "lower-all",
        },
      };

      await this.room.localParticipant.sendText(JSON.stringify(envelope), {
        topic: "raise-hand:v1",
      });

      logger.debug("All hands lowered");
    } catch (error) {
      logger.error("Failed to lower all hands", error);
      useRtcStore.getState().addError({
        code: "LOWER_ALL_HANDS_SEND_FAILED",
        message:
          error instanceof Error ? error.message : "Failed to lower all hands",
        timestamp: Date.now(),
      });
    }
  }

  private handleIncoming(text: string): void {
    try {
      const parsed = JSON.parse(text) as RaiseHandEnvelope;
      if (!this.isValidEnvelope(parsed)) {
        logger.warn("Invalid raise-hand envelope received", parsed);
        return;
      }

      if (parsed.sender.id === this.getLocalParticipantId()) {
        logger.debug("Ignoring self-echo raise-hand message");
        return;
      }

      applyIncomingRaiseHand(parsed);
      logger.debug("Raise-hand message received", {
        action: parsed.payload.action,
      });
    } catch (error) {
      logger.error("Error parsing incoming raise-hand message", error);
    }
  }

  private isValidEnvelope(e: any): e is RaiseHandEnvelope {
    return (
      e &&
      e.v === 1 &&
      e.kind === "raise-hand" &&
      typeof e.roomId === "string" &&
      e.roomId === this.room.name &&
      typeof e.ts === "number" &&
      e.ts > 0 &&
      typeof e.sender?.id === "string" &&
      typeof e.payload?.action === "string" &&
      ["raise", "lower", "lower-all"].includes(e.payload.action)
    );
  }

  private getSenderInfo(): { id: string; info?: ParticipantMetadata } {
    const localParticipant = this.room.localParticipant;
    const sender: { id: string; info?: ParticipantMetadata } = {
      id: localParticipant.identity,
    };

    if (localParticipant.metadata) {
      try {
        sender.info = JSON.parse(
          localParticipant.metadata
        ) as ParticipantMetadata;
      } catch {
        // Ignore metadata parse errors
      }
    }

    return sender;
  }
}
