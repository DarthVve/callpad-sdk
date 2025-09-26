import type { Room, RoomOptions } from "livekit-client";
import { DeviceManager } from "./device.manager";
import { MediaControls } from "./media.controls";
import { ParticipantManager } from "./participant.manager";
import { RoomManager } from "./room.manager";
import type { LiveKitServiceOptions } from "./types";

export class LiveKitService {
  private roomManager: RoomManager;
  private participantManager?: ParticipantManager;
  private mediaControls?: MediaControls;
  private deviceManager?: DeviceManager;
  private options: LiveKitServiceOptions;

  constructor(options: LiveKitServiceOptions = {}) {
    this.options = options;
    this.roomManager = new RoomManager();
  }

  async joinRoom(token: string, url?: string): Promise<void> {
    const roomUrl = url || this.options.livekitUrl;

    if (!roomUrl) {
      const error = new Error("LiveKit URL not configured");
      this.options.log?.("error", "LiveKit URL missing", { token, url });
      throw error;
    }

    try {
      this.options.log?.("info", "Joining LiveKit room", { url: roomUrl });
      await this.roomManager.connect({ url: roomUrl, token });

      // Initialize managers after a successful connection
      this.participantManager = new ParticipantManager(this.room);
      this.mediaControls = new MediaControls(this.room.localParticipant);
      this.deviceManager = new DeviceManager(this.room);

      // Enumerate devices after connection
      try {
        await this.deviceManager.enumerateDevices();
        this.options.log?.("info", "Device enumeration completed");
      } catch (error) {
        this.options.log?.("warn", "Failed to enumerate devices", error);
        // Don't fail the connection if device enumeration fails
      }

      this.options.log?.("info", "Successfully joined LiveKit room");
    } catch (error) {
      this.options.log?.("error", "Failed to join LiveKit room", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.options.log?.("info", "Disconnecting from LiveKit room");

      // Cleanup managers first
      this.participantManager?.destroy();
      this.participantManager = undefined;
      this.deviceManager?.destroy();
      this.deviceManager = undefined;
      this.mediaControls = undefined;

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

  get media(): MediaControls {
    if (!this.mediaControls) {
      throw new Error("Media controls not available - room not connected");
    }
    return this.mediaControls;
  }

  get devices(): DeviceManager {
    if (!this.deviceManager) {
      throw new Error("Device manager not available - room not connected");
    }
    return this.deviceManager;
  }

  destroy(): void {
    this.participantManager?.destroy();
    this.participantManager = undefined;
    this.deviceManager?.destroy();
    this.deviceManager = undefined;
    this.mediaControls = undefined;
    this.roomManager.destroy();
  }
}
