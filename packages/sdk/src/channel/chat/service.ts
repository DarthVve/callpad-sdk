import {ConnectionState, type Room} from "livekit-client";
import type {ChatEntry, Envelope} from "./types";
import type {ParticipantMetadata} from "../../state/types";
import {useChatStore} from "./store";
import {useRtcStore} from "../../state/store";
import {generateEntryId, getCurrentTimestamp, isValidEnvelope, validateContent,} from "./utils";
import {createLogger} from "../../utils";

const logger = createLogger("chat");

export class ChatService {
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
    if (this.isSubscribed) {
      return;
    }

    this.room.registerTextStreamHandler(
      "chat:v1",
      async (reader, participantInfo) => {
        try {
          const text = await reader.readAll();
          this.handleIncomingMessage(text);
        } catch (error) {
          logger.error("Error reading text stream", error);
        }
      }
    );

    this.isSubscribed = true;
  }

  unsubscribe(): void {
    this.isSubscribed = false;
  }

  getLocalParticipantSid(): string {
    return this.room.localParticipant.sid;
  }

  async send(content: string): Promise<void> {
    if (!this.isRoomReady()) {
      useRtcStore.getState().addError({
        code: "CHAT_ROOM_NOT_READY",
        message: "Cannot send message: room not connected",
        timestamp: Date.now(),
      });
      return;
    }

    const validation = validateContent(content);
    if (!validation.valid) {
      useRtcStore.getState().addError({
        code: "CHAT_INVALID_CONTENT",
        message: validation.error || "Invalid content",
        timestamp: Date.now(),
      });
      return;
    }

    const entryId = generateEntryId();
    const chatStore = useChatStore.getState();

    const entry: ChatEntry = {
      id: entryId,
      content,
      sender: this.getSenderInfo(),
      createdAt: getCurrentTimestamp(),
      version: 1,
      reactions: {},
      status: "sending",
    };

    chatStore.addEntryOptimistic(entry);
    try {
      const envelope: Envelope = {
        v: 1,
        kind: "entry",
        roomId: this.room.name,
        entryId,
        ts: entry.createdAt,
        sender: entry.sender,
        payload: {
          content,
        },
      };

      await this.room.localParticipant.sendText(JSON.stringify(envelope), {
        topic: "chat:v1",
      });

      chatStore.markEntrySent(entryId);
    } catch (error) {
      chatStore.markEntryFailed(entryId);
      useRtcStore.getState().addError({
        code: "CHAT_SEND_FAILED",
        message: error instanceof Error ? error.message : "Failed to send message",
        timestamp: Date.now(),
        context: { entryId },
      });
    }
  }

  async edit(entryId: string, newContent: string): Promise<void> {
    if (!this.isRoomReady()) {
      useRtcStore.getState().addError({
        code: "CHAT_ROOM_NOT_READY",
        message: "Cannot edit message: room not connected",
        timestamp: Date.now(),
      });
      return;
    }

    const validation = validateContent(newContent);
    if (!validation.valid) {
      useRtcStore.getState().addError({
        code: "CHAT_INVALID_CONTENT",
        message: validation.error || "Invalid content",
        timestamp: Date.now(),
      });
      return;
    }

    const chatStore = useChatStore.getState();
    const entry = chatStore.byId[entryId];
    if (!entry) {
      useRtcStore.getState().addError({
        code: "CHAT_ENTRY_NOT_FOUND",
        message: "Entry not found",
        timestamp: Date.now(),
        context: { entryId },
      });
      return;
    }

    const senderInfo = this.getSenderInfo();
    if (entry.sender.sid !== senderInfo.sid) {
      useRtcStore.getState().addError({
        code: "CHAT_UNAUTHORIZED",
        message: "You can only edit your own messages",
        timestamp: Date.now(),
        context: { entryId },
      });
      return;
    }

    const newVersion = entry.version + 1;
    chatStore.applyEdit(entryId, newContent, newVersion);
    try {
      const envelope: Envelope = {
        v: 1,
        kind: "edit",
        roomId: this.room.name,
        entryId,
        ts: getCurrentTimestamp(),
        sender: senderInfo,
        payload: {
          newContent,
          version: newVersion,
        },
      };

      await this.room.localParticipant.sendText(JSON.stringify(envelope), {
        topic: "chat:v1",
      });
    } catch (error) {
      useRtcStore.getState().addError({
        code: "CHAT_EDIT_FAILED",
        message: error instanceof Error ? error.message : "Failed to edit message",
        timestamp: Date.now(),
        context: { entryId },
      });
    }
  }

  async remove(entryId: string): Promise<void> {
    if (!this.isRoomReady()) {
      useRtcStore.getState().addError({
        code: "CHAT_ROOM_NOT_READY",
        message: "Cannot remove message: room not connected",
        timestamp: Date.now(),
      });
      return;
    }

    const chatStore = useChatStore.getState();
    const entry = chatStore.byId[entryId];
    if (!entry) {
      useRtcStore.getState().addError({
        code: "CHAT_ENTRY_NOT_FOUND",
        message: "Entry not found",
        timestamp: Date.now(),
        context: { entryId },
      });
      return;
    }

    const senderInfo = this.getSenderInfo();
    if (entry.sender.sid !== senderInfo.sid) {
      useRtcStore.getState().addError({
        code: "CHAT_UNAUTHORIZED",
        message: "You can only remove your own messages",
        timestamp: Date.now(),
        context: { entryId },
      });
      return;
    }

    chatStore.applyRemove(entryId);
    try {
      const envelope: Envelope = {
        v: 1,
        kind: "remove",
        roomId: this.room.name,
        entryId,
        ts: getCurrentTimestamp(),
        sender: senderInfo,
      };

      await this.room.localParticipant.sendText(JSON.stringify(envelope), {
        topic: "chat:v1",
      });
    } catch (error) {
      useRtcStore.getState().addError({
        code: "CHAT_REMOVE_FAILED",
        message: error instanceof Error ? error.message : "Failed to remove message",
        timestamp: Date.now(),
        context: { entryId },
      });
    }
  }

  async react(entryId: string, emoji: string): Promise<void> {
    if (!this.isRoomReady()) {
      useRtcStore.getState().addError({
        code: "CHAT_ROOM_NOT_READY",
        message: "Cannot add reaction: room not connected",
        timestamp: Date.now(),
      });
      return;
    }

    const chatStore = useChatStore.getState();
    const entry = chatStore.byId[entryId];

    if (!entry) {
      return;
    }

    const senderInfo = this.getSenderInfo();
    chatStore.applyReaction(entryId, emoji, senderInfo.sid, "add");

    try {
      const envelope: Envelope = {
        v: 1,
        kind: "reaction",
        roomId: this.room.name,
        entryId,
        ts: getCurrentTimestamp(),
        sender: senderInfo,
        payload: {
          emoji,
          op: "add",
        },
      };

      await this.room.localParticipant.sendText(JSON.stringify(envelope), {
        topic: "chat:v1",
      });
    } catch (error) {
      useRtcStore.getState().addError({
        code: "CHAT_REACTION_FAILED",
        message: error instanceof Error ? error.message : "Failed to add reaction",
        timestamp: Date.now(),
        context: { entryId, emoji },
      });
    }
  }

  async unreact(entryId: string, emoji: string): Promise<void> {
    if (!this.isRoomReady()) {
      useRtcStore.getState().addError({
        code: "CHAT_ROOM_NOT_READY",
        message: "Cannot remove reaction: room not connected",
        timestamp: Date.now(),
      });
      return;
    }

    const chatStore = useChatStore.getState();
    const entry = chatStore.byId[entryId];

    if (!entry) {
      return;
    }

    const senderInfo = this.getSenderInfo();
    chatStore.applyReaction(entryId, emoji, senderInfo.sid, "remove");

    try {
      const envelope: Envelope = {
        v: 1,
        kind: "reaction",
        roomId: this.room.name,
        entryId,
        ts: getCurrentTimestamp(),
        sender: senderInfo,
        payload: {
          emoji,
          op: "remove",
        },
      };

      await this.room.localParticipant.sendText(JSON.stringify(envelope), {
        topic: "chat:v1",
      });
    } catch (error) {
      useRtcStore.getState().addError({
        code: "CHAT_REACTION_FAILED",
        message:
          error instanceof Error ? error.message : "Failed to remove reaction",
        timestamp: Date.now(),
        context: { entryId, emoji },
      });
    }
  }

  private handleIncomingMessage(text: string): void {
    try {
      const parsed = JSON.parse(text);

      if (!isValidEnvelope(parsed)) {
        logger.warn("Invalid envelope received", parsed);
        return;
      }

      useChatStore.getState().applyIncoming(parsed);
    } catch (error) {
      logger.error("Error parsing incoming message", error);
    }
  }

  private getSenderInfo(): { sid: string; identity: string; info?: ParticipantMetadata } {
    const localParticipant = this.room.localParticipant;
    const sender: { sid: string; identity: string; info?: ParticipantMetadata } = {
      sid: localParticipant.sid,
      identity: localParticipant.identity,
    };

    if (localParticipant.metadata) {
      try {
          sender.info = JSON.parse(localParticipant.metadata) as ParticipantMetadata;
      } catch {
        // Ignore metadata parsing errors
      }
    }

    return sender;
  }
}
