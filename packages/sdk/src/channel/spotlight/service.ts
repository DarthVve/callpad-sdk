import { ConnectionState, type Room } from "livekit-client";
import { useRtcStore } from "../../state/store";
import type { ParticipantMetadata } from "../../state/types";
import { createLogger } from "../../utils";
import { applyIncomingSpotlight, useSpotlightStore } from "./store";
import type { SpotlightEnvelope } from "./types";

const logger = createLogger("spotlight");

export class SpotlightService {
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

    this.room.registerTextStreamHandler("spotlight:v1", async (reader) => {
      try {
        const text = await reader.readAll();
        this.handleIncoming(text);
      } catch (err) {
        logger.error("Error reading spotlight stream", err);
      }
    });

    this.isSubscribed = true;
    logger.info("SpotlightService subscribed");
  }

  unsubscribe(): void {
    this.isSubscribed = false;
    logger.info("SpotlightService unsubscribed");
  }

  getLocalParticipantId(): string {
    return this.room.localParticipant.identity;
  }

  async spotlight(targetId: string): Promise<void> {
    if (!this.isRoomReady()) {
      useRtcStore.getState().addError({
        code: "SPOTLIGHT_ROOM_NOT_READY",
        message: "Cannot spotlight: room not connected",
        timestamp: Date.now(),
      });
      return;
    }

    const senderInfo = this.getSenderInfo();
    // Store previous state for rollback
    const previousSpotlighted = useSpotlightStore.getState().getSpotlightedUser();
    
    // Optimistically update store
    useSpotlightStore.getState().spotlight(targetId);

    try {
      const envelope: SpotlightEnvelope = {
        v: 1,
        kind: "spotlight",
        roomId: this.room.name,
        ts: Date.now(),
        sender: senderInfo,
        payload: {
          action: "spotlight",
          targetId,
        },
      };

      await this.room.localParticipant.sendText(JSON.stringify(envelope), {
        topic: "spotlight:v1",
      });

      logger.info("User spotlighted", { targetId });
    } catch (error) {
      logger.error("Failed to spotlight user", error);
      
      // Rollback to previous state on failure
      if (previousSpotlighted) {
        useSpotlightStore.getState().spotlight(previousSpotlighted.participantId, previousSpotlighted.info);
      } else {
        useSpotlightStore.getState().unspotlight();
      }
      
      useRtcStore.getState().addError({
        code: "SPOTLIGHT_SEND_FAILED",
        message:
          error instanceof Error ? error.message : "Failed to spotlight user",
        timestamp: Date.now(),
      });
    }
  }

  async unspotlight(): Promise<void> {
    if (!this.isRoomReady()) {
      useRtcStore.getState().addError({
        code: "UNSPOTLIGHT_ROOM_NOT_READY",
        message: "Cannot unspotlight: room not connected",
        timestamp: Date.now(),
      });
      return;
    }

    const senderInfo = this.getSenderInfo();
    const currentSpotlighted = useSpotlightStore.getState().getSpotlightedUser();
    
    if (!currentSpotlighted) {
      logger.debug("No user is currently spotlighted");
      return;
    }

    // Store previous state for rollback
    const previousSpotlighted = { ...currentSpotlighted };
    
    // Optimistically update store
    useSpotlightStore.getState().unspotlight();

    try {
      const envelope: SpotlightEnvelope = {
        v: 1,
        kind: "spotlight",
        roomId: this.room.name,
        ts: Date.now(),
        sender: senderInfo,
        payload: {
          action: "unspotlight",
          targetId: previousSpotlighted.participantId,
        },
      };

      await this.room.localParticipant.sendText(JSON.stringify(envelope), {
        topic: "spotlight:v1",
      });

      logger.info("User unspotlighted");
    } catch (error) {
      logger.error("Failed to unspotlight user", error);
      
      // Rollback to previous state on failure
      useSpotlightStore.getState().spotlight(previousSpotlighted.participantId, previousSpotlighted.info);
      
      useRtcStore.getState().addError({
        code: "UNSPOTLIGHT_SEND_FAILED",
        message:
          error instanceof Error ? error.message : "Failed to unspotlight user",
        timestamp: Date.now(),
      });
    }
  }

  private handleIncoming(text: string): void {
    try {
      const parsed = JSON.parse(text) as SpotlightEnvelope;
      if (!this.isValidEnvelope(parsed)) {
        logger.warn("Invalid spotlight envelope received", parsed);
        return;
      }

      if (parsed.sender.id === this.getLocalParticipantId()) {
        logger.debug("Ignoring self-echo spotlight message");
        return;
      }

      applyIncomingSpotlight(parsed);
      logger.debug("Spotlight message received", {
        action: parsed.payload.action,
        targetId: parsed.payload.targetId,
      });
    } catch (error) {
      logger.error("Error parsing incoming spotlight message", error);
    }
  }

  private isValidEnvelope(e: any): e is SpotlightEnvelope {
    return (
      e &&
      e.v === 1 &&
      e.kind === "spotlight" &&
      typeof e.roomId === "string" &&
      e.roomId === this.room.name &&
      typeof e.ts === "number" &&
      e.ts > 0 &&
      typeof e.sender?.id === "string" &&
      typeof e.payload?.action === "string" &&
      ["spotlight", "unspotlight"].includes(e.payload.action) &&
      typeof e.payload?.targetId === "string"
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

