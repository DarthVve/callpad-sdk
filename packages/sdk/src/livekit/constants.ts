import type { ConnectionQuality, RoomOptions } from "livekit-client";
import { VideoPresets } from "livekit-client";

export const DEFAULT_ROOM_OPTIONS: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  videoCaptureDefaults: {
    facingMode: "user",
  },
  publishDefaults: {
    videoSimulcastLayers: [
      VideoPresets.h180,
      VideoPresets.h360,
      VideoPresets.h720,
    ],
  },
  audioCaptureDefaults: {
    autoGainControl: true,
    echoCancellation: true,
    noiseSuppression: true,
  },
};

export const TRACK_ATTACHMENT_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
} as const;
