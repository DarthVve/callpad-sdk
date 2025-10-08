import type { Room } from "livekit-client";
import { RoomManager } from "./room.manager";
import type { LiveKitServiceOptions } from "./types";

export class LiveKitService {
  private roomManager: RoomManager;
  private options: LiveKitServiceOptions;

  constructor(options: LiveKitServiceOptions = { log: undefined }) {
    this.options = options;
    this.roomManager = new RoomManager();
  }

  async disconnect(): Promise<void> {
    try {
      this.options.log?.("info", "Disconnecting from LiveKit room");

      await this.roomManager.disconnect();
      this.options.log?.("info", "Successfully disconnected from LiveKit room");
    } catch (error) {
      this.options.log?.("error", "Error during LiveKit disconnect", error);
      throw error;
    }
  }

  get room(): Room {
    return this.roomManager.room;
  }

  /**
   * Check if audio playback is currently allowed by the browser
   */
  get canPlaybackAudio(): boolean {
    return this.roomManager.canPlaybackAudio;
  }

  async startAudioWithUserInteraction(): Promise<boolean> {
    return this.roomManager.startAudioWithUserInteraction();
  }

  destroy(): void {
    this.roomManager.destroy();
  }
}
