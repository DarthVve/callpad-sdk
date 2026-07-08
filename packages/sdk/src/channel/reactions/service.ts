import { ConnectionState, type Room } from "livekit-client";
import { useRtcStore } from "../../state/store";
import type { ParticipantMetadata } from "../../state/types";
import { createLogger } from "../../utils";
import { applyIncomingReaction, useReactionsStore } from "./store";
import type { ReactionEnvelope } from "./types";
import { generateNonce, validateEmoji } from "./utils";

const logger = createLogger("reactions");

export class ReactionsService {
  private readonly room: Room;
  private isSubscribed = false;
  private pruneInterval: ReturnType<typeof setInterval> | undefined;
  private lastSendAt = 0;
  private minIntervalMs = 200;
  private lastRemoteTs = new Map<string, number>();

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

  private canSendNow(): boolean {
    const now = Date.now();
    if (now - this.lastSendAt < this.minIntervalMs) return false;
    this.lastSendAt = now;
    return true;
  }

  subscribe(): void {
    if (this.isSubscribed) return;

    this.room.registerTextStreamHandler("reactions:v1", async (reader) => {
      try {
        const text = await reader.readAll();
        this.handleIncoming(text);
      } catch (err) {
        logger.error("Error reading reactions stream", err);
      }
    });

    this.pruneInterval = setInterval(() => {
      useReactionsStore.getState().pruneExpired();
    }, 1000);

    this.isSubscribed = true;
    logger.info("ReactionsService subscribed");
  }

  unsubscribe(): void {
    this.isSubscribed = false;
    if (this.pruneInterval) {
      clearInterval(this.pruneInterval);
      this.pruneInterval = undefined;
    }
    logger.info("ReactionsService unsubscribed");
  }

  getLocalParticipantId(): string {
    return this.room.localParticipant.identity;
  }

  async sendReaction(emoji: string): Promise<void> {
    if (!this.isRoomReady()) {
      useRtcStore.getState().addError({
        code: "REACTIONS_ROOM_NOT_READY",
        message: "Cannot send reaction: room not connected",
        timestamp: Date.now(),
      });
      return;
    }

    const validation = validateEmoji(emoji);
    if (!validation.valid) {
      useRtcStore.getState().addError({
        code: "REACTIONS_INVALID_EMOJI",
        message: validation.error || "Invalid emoji",
        timestamp: Date.now(),
      });
      return;
    }

    if (!this.canSendNow()) {
      logger.debug("Rate limited, skipping send");
      return;
    }

    const senderInfo = this.getSenderInfo();
    const ts = Date.now();
    const nonce = generateNonce();

    useReactionsStore.getState().setReaction(senderInfo.id, {
      emoji,
      ts,
      nonce,
    });

    try {
      const envelope: ReactionEnvelope = {
        v: 1,
        kind: "reaction",
        roomId: this.room.name,
        ts,
        sender: senderInfo,
        payload: {
          emoji,
          nonce,
        },
      };

      await this.room.localParticipant.sendText(JSON.stringify(envelope), {
        topic: "reactions:v1",
      });

      logger.debug("Reaction sent", { emoji });
    } catch (error) {
      logger.error("Failed to send reaction", error);
      useRtcStore.getState().addError({
        code: "REACTIONS_SEND_FAILED",
        message:
          error instanceof Error ? error.message : "Failed to send reaction",
        timestamp: Date.now(),
        context: { emoji },
      });
    }
  }

  private handleIncoming(text: string): void {
    try {
      const parsed = JSON.parse(text) as ReactionEnvelope;
      if (!this.isValidEnvelope(parsed)) {
        logger.warn("Invalid reaction envelope received", parsed);
        return;
      }

      if (parsed.sender.id === this.getLocalParticipantId()) {
        logger.debug("Ignoring self-echo reaction");
        return;
      }

      const lastTs =
        this.lastRemoteTs.get(parsed.sender.id) ?? Number.NEGATIVE_INFINITY;
      if (parsed.ts < lastTs) {
        logger.debug("Ignoring out-of-order reaction", {
          sender: parsed.sender.id,
          ts: parsed.ts,
          lastTs,
        });
        return;
      }
      this.lastRemoteTs.set(parsed.sender.id, parsed.ts);
      applyIncomingReaction(parsed);
      logger.debug("Reaction received", { emoji: parsed.payload.emoji });
    } catch (error) {
      logger.error("Error parsing incoming reaction", error);
    }
  }

  private isValidEnvelope(e: any): e is ReactionEnvelope {
    return (
      e &&
      e.v === 1 &&
      e.kind === "reaction" &&
      typeof e.roomId === "string" &&
      e.roomId === this.room.name &&
      typeof e.ts === "number" &&
      e.ts > 0 &&
      typeof e.sender?.id === "string" &&
      typeof e.payload?.emoji === "string" &&
      typeof e.payload?.nonce === "string"
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
