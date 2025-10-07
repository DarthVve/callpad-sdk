import {
  ConnectionState,
  Room,
  RoomEvent,
  type RoomOptions,
} from "livekit-client";
import { createLogger } from "../utils/logger";
import { DEFAULT_ROOM_OPTIONS, type LiveKitConnectionConfig } from "./";

export class RoomManager {
  private readonly _room: Room;
  private _preparingConnection: Promise<void> | null = null;
  private logger = createLogger("livekit:room");
  private _audioPlaybackHandler: (() => void) | undefined;

  constructor(options?: Partial<RoomOptions>) {
    this._room = new Room({
      ...DEFAULT_ROOM_OPTIONS,
      ...options,
    });
    
    this.setupAudioPlaybackMonitoring();
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
      this.logger.debug(
        "Audio start failed - user interaction may be required",
        { error }
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

  /**
   * Sets up audio playback status monitoring according to LiveKit best practices
   */
  private setupAudioPlaybackMonitoring(): void {
    this._audioPlaybackHandler = () => {
      const canPlayback = this._room.canPlaybackAudio;
      this.logger.debug("Audio playback status changed", { canPlayback });
      
      if (!canPlayback) {
        this.logger.info(
          "Audio playback requires user interaction - audio will be silent until user interacts"
        );
        // Note: UI should provide a play button that calls this.startAudioWithUserInteraction()
      } else {
        this.logger.debug("Audio playback is now available");
      }
    };

    this._room.on(RoomEvent.AudioPlaybackStatusChanged, this._audioPlaybackHandler);
  }

  /**
   * Attempts to start audio playback (must be called from user interaction)
   * Returns true if successful, false if user interaction is still required
   */
  async startAudioWithUserInteraction(): Promise<boolean> {
    try {
      await this._room.startAudio();
      this.logger.info("Audio playback started successfully via user interaction");
      return true;
    } catch (error) {
      this.logger.warn("Failed to start audio playback even with user interaction", { error });
      return false;
    }
  }

  /**
   * Check if audio playback is currently allowed
   */
  get canPlaybackAudio(): boolean {
    return this._room.canPlaybackAudio;
  }

  destroy(): void {
    // Clean up audio monitoring
    if (this._audioPlaybackHandler) {
      this._room.off(RoomEvent.AudioPlaybackStatusChanged, this._audioPlaybackHandler);
      this._audioPlaybackHandler = undefined;
    }

    // Cancel any pending preparation
    this._preparingConnection = null;

    // Room cleanup is handled by LiveKit's disconnect
  }
}
