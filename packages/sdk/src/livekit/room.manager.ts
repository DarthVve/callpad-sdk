import { Room, RoomEvent, type RoomOptions } from "livekit-client";
import { rtcStore } from "../state/store";
import { DEFAULT_ROOM_OPTIONS, type LiveKitConnectionConfig } from "./";

export class RoomManager {
  private readonly _room: Room;

  constructor(options?: Partial<RoomOptions>) {
    this._room = new Room({
      ...DEFAULT_ROOM_OPTIONS,
      ...options,
    });
  }

  async connect(config: LiveKitConnectionConfig): Promise<void> {
    await this._room.prepareConnection(config.url, config.token);

    this.setupEventListeners();
    await this._room.connect(config.url, config.token);
  }

  async disconnect(): Promise<void> {
    await this._room.disconnect();
  }

  private setupEventListeners(): void {
    this._room
      .on(RoomEvent.Connected, () => {
        rtcStore.getState().patch((state) => {
          state.connection.connected = true;
          state.connection.reconnecting = false;
        });
      })
      .on(RoomEvent.Disconnected, () => {
        rtcStore.getState().patch((state) => {
          state.connection.connected = false;
          state.connection.reconnecting = false;
        });
      })
      .on(RoomEvent.Reconnecting, () => {
        rtcStore.getState().patch((state) => {
          state.connection.reconnecting = true;
        });
      })
      .on(RoomEvent.Reconnected, () => {
        rtcStore.getState().patch((state) => {
          state.connection.connected = true;
          state.connection.reconnecting = false;
        });
      })
      .on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        rtcStore.getState().patch((state) => {
          if (participant?.identity) {
            const participantState = state.participants[participant.identity];
            if (participantState) {
              participantState.metadata = {
                ...participantState.metadata,
                connectionQuality: quality,
              };
            }
          }

          if (participant?.isLocal) {
            let qualityLabel: "excellent" | "good" | "poor" | "lost";
            if (quality === "excellent") {
              qualityLabel = "excellent";
            } else if (quality === "good") {
              qualityLabel = "good";
            } else if (quality === "poor") {
              qualityLabel = "poor";
            } else {
              qualityLabel = "lost";
            }
            state.connection.quality = qualityLabel;
          }
        });
      });
  }

  get room(): Room {
    return this._room;
  }

  destroy(): void {
    this._room.removeAllListeners();
  }
}
