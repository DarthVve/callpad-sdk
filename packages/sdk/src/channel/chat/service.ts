import { ConnectionState, type Room } from "livekit-client";
import { useRtcStore } from "../../state/store";
import type { ParticipantMetadata } from "../../state/types";
import { createLogger } from "../../utils";
import { useChatStore } from "./store";
import type { ChatEntry, Envelope } from "./types";
import {
  generateEntryId,
  getCurrentTimestamp,
  isValidEnvelope,
  validateContent,
} from "./utils";

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
    // Handles incoming text streams
    this.room.registerTextStreamHandler(
      "chat:v1",
      async (reader, participantInfo) => {
          console.log("Got here: chat:v1", participantInfo.identity)
        try {
          const text = await reader.readAll();
            console.log("Got here: chat:v1", text)
          this.handleIncomingMessage(text);

        } catch (error) {
          logger.error("Error reading text stream", error);
        }
      }
    );

    // Handles incoming file streams
    this.room.registerByteStreamHandler('chat:v1', async (reader, participantInfo) => {
      try {
        const info = reader.info;
        const filename = info.name

        // Confirm reciept of file
        reader.onProgress = (progress) => {
          console.log(`${progress ? (progress * 100).toFixed(0) : 'undefined'}% of ${filename} downloaded`);
        };

        // Ensure BlobParts are backed by ArrayBuffer (not SharedArrayBuffer) by copying with slice().
        const parts = (await reader.readAll()).map((chunk) => chunk.slice());
        const fileBlob = new Blob(parts, { type: info.mimeType });

        this.handleIncomingFile(fileBlob, filename, info.mimeType)

        console.log(
          `File "${info.name}" received from ${participantInfo.identity}\n` +
          `  Topic: ${info.topic}\n` +
          `  Timestamp: ${info.timestamp}\n` +
          `  ID: ${info.id}\n` +
          `  Size: ${info.size}`
        );
      } catch (error) {
        logger.error("Error reading file stream", error);
      }
    });
    this.isSubscribed = true;
  }

  unsubscribe(): void {
    this.isSubscribed = false;
  }

  getLocalParticipantId(): string {
    return this.room.localParticipant.identity;
  }

  async send(content: string, file?: File): Promise<void> {
    if (!this.isRoomReady()) {
      useRtcStore.getState().addError({
        code: "CHAT_ROOM_NOT_READY",
        message: "Cannot send message: room not connected",
        timestamp: Date.now(),
      });
      return;
    }

    if (content.length === 0 && typeof file !== "undefined") {
      console.log("file present", typeof file)
      content = file.name
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
    const senderInfo = this.getSenderInfo();
    if (senderInfo.info) {
      chatStore.patch((state) => {
        state.participantCache[senderInfo.id] = senderInfo.info!;
      });
    }

    const entry: ChatEntry = {
      id: entryId,
      content,
      sender: {
        id: senderInfo.id,
      },
      createdAt: getCurrentTimestamp(),
      version: 1,
      reactions: {},
      status: "sending",
      file: file!
    };

    chatStore.addEntryOptimistic(entry);
    try {
      const envelope: Envelope = {
        v: 1,
        kind: "entry",
        roomId: this.room.name,
        entryId,
        ts: entry.createdAt,
        sender: senderInfo,
        payload: {
          content,
          meta: {filename: file!.name}
        },
      };

      await this.room.localParticipant.sendText(JSON.stringify(envelope), {
        topic: "chat:v1",
      });
      if (file) {
        await this.room.localParticipant.sendFile(file, {
          destinationIdentities: [entryId],
          mimeType: file.type,
          topic: 'chat:v1'
        });
      }
      chatStore.markEntrySent(entryId);
    } catch (error) {
      chatStore.markEntryFailed(entryId);
      useRtcStore.getState().addError({
        code: "CHAT_SEND_FAILED",
        message:
          error instanceof Error ? error.message : "Failed to send message",
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
    if (entry.sender.id !== senderInfo.id) {
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
        message:
          error instanceof Error ? error.message : "Failed to edit message",
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
    if (entry.sender.id !== senderInfo.id) {
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
        message:
          error instanceof Error ? error.message : "Failed to remove message",
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
    if (senderInfo.info) {
      chatStore.patch((state) => {
        state.participantCache[senderInfo.id] = senderInfo.info!;
      });
    }

    chatStore.applyReaction(entryId, emoji, senderInfo.id, "add");
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
        message:
          error instanceof Error ? error.message : "Failed to add reaction",
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
    if (senderInfo.info) {
      chatStore.patch((state) => {
        state.participantCache[senderInfo.id] = senderInfo.info!;
      });
    }

    chatStore.applyReaction(entryId, emoji, senderInfo.id, "remove");
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

  private handleIncomingFile(blob: Blob, filename: string, mimeType: string): void {
    try {
      const file = new File([blob], filename, { type: mimeType || blob.type });

      useChatStore.getState().addFile(file, filename);
    } catch (error) {
      logger.error("Error parsing incoming file", error);
    }
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
        // Ignore metadata parsing errors
      }
    }

    return sender;
  }
}
