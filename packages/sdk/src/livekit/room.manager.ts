import {
  ConnectionState,
  Room,
  RoomEvent,
  type RoomOptions,
} from "livekit-client";
import { DEFAULT_ROOM_OPTIONS, type LiveKitConnectionConfig } from "./";

export class RoomManager {
  private readonly _room: Room;
  private _preparingConnection: Promise<void> | null = null;

  constructor(options?: Partial<RoomOptions>) {
    this._room = new Room({
      ...DEFAULT_ROOM_OPTIONS,
      ...options,
    });
  }

  /**
   * Prepares the room connection for faster subsequent connect()
   * This is optional but recommended for better UX
   */
  async prepareConnection(url: string, token?: string): Promise<void> {
    if (this._preparingConnection) {
      return this._preparingConnection;
    }

    this._preparingConnection = this._room.prepareConnection(url, token);
    try {
      await this._preparingConnection;
    } finally {
      this._preparingConnection = null;
    }
  }

  async connect(config: LiveKitConnectionConfig): Promise<void> {
    // If we haven't prepared the connection, prepare it now
    if (
      !this._preparingConnection &&
      this._room.state === ConnectionState.Disconnected
    ) {
      await this.prepareConnection(config.url, config.token);
    }

    await this._room.connect(config.url, config.token);

    // Start audio playback for browser policy compliance
    try {
      await this._room.startAudio();
    } catch (error) {
      // Non-critical error - user might need to interact first
      console.debug(
        "Audio start failed - user interaction may be required:",
        error
      );
    }
  }

  async disconnect(): Promise<void> {
    // Cancel any pending preparation
    this._preparingConnection = null;

    await this._room.disconnect();
  }

  get room(): Room {
    return this._room;
  }

  destroy(): void {
    // Cancel any pending preparation
    this._preparingConnection = null;

    // Room cleanup is handled by LiveKit's disconnect
  }
}
