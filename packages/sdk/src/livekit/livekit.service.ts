import type { Room, RoomOptions } from "livekit-client";
import { ParticipantInfoService } from "../services/participant-info.service";
import { DeviceManager } from "./device.manager";
import { LiveKitEventBridge } from "./events/eventBridge";
import { MediaControls } from "./media.controls";
import { RoomManager } from "./room.manager";
import type { LiveKitServiceOptions } from "./types";

export class LiveKitService {
  private roomManager: RoomManager;
  private eventBridge: LiveKitEventBridge | undefined;
  private mediaControls: MediaControls | undefined;
  private deviceManager: DeviceManager | undefined;
  private participantInfoService: ParticipantInfoService;
  private options: LiveKitServiceOptions;

  constructor(options: LiveKitServiceOptions = { log: undefined }) {
    this.options = options;
    this.roomManager = new RoomManager();
    this.participantInfoService = new ParticipantInfoService();
  }

  async joinRoom(token: string, url: string): Promise<void> {
    if (!url) {
      const error = new Error("LiveKit URL is required");
      this.options.log?.("error", "LiveKit URL missing", { token, url });
      throw error;
    }

    try {
      this.options.log?.("info", "Joining LiveKit room", { url });
      await this.roomManager.connect({ url, token });

      // Initialize managers after a successful connection
      const eventBridgeOptions: {
        log?: (
          lvl: "debug" | "info" | "warn" | "error",
          msg: string,
          extra?: any
        ) => void;
        participantInfoService?: ParticipantInfoService;
        appId?: string;
      } = {};
      if (this.options.log) {
        eventBridgeOptions.log = this.options.log;
      }
      if (this.options.appId) {
        eventBridgeOptions.appId = this.options.appId;
        eventBridgeOptions.participantInfoService = this.participantInfoService;
      }
      this.eventBridge = new LiveKitEventBridge(this.room, eventBridgeOptions);
      this.mediaControls = new MediaControls(
        this.room.localParticipant,
        this.room
      );
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
      this.eventBridge?.destroy();
      this.eventBridge = undefined;
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

  /**
   * Check if audio playback is currently allowed by the browser
   */
  get canPlaybackAudio(): boolean {
    return this.roomManager.canPlaybackAudio;
  }

  /**
   * Attempts to start audio playback (must be called from user interaction)
   * Returns true if successful, false if user interaction is still required
   */
  async startAudioWithUserInteraction(): Promise<boolean> {
    return this.roomManager.startAudioWithUserInteraction();
  }

  destroy(): void {
    this.eventBridge?.destroy();
    this.eventBridge = undefined;
    this.deviceManager?.destroy();
    this.deviceManager = undefined;
    this.mediaControls = undefined;
    this.roomManager.destroy();
  }
}
