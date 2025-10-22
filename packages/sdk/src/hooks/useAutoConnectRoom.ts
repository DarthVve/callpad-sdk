import { Room, type RoomOptions, VideoPresets } from "livekit-client";
import { useCallback, useEffect, useMemo } from "react";
import { useSdk } from "../provider/RtcProvider";
import { createLogger } from "../utils";
import { useLivekitInfo } from "./useLivekitInfo";
import { useRoomReady } from "./useRoomReady";

const logger = createLogger("useAutoConnectRoom");

const defaultVideoOptions: Partial<RoomOptions> = {
  adaptiveStream: true,
  dynacast: true,
  videoCaptureDefaults: {
    resolution: VideoPresets.h720.resolution,
  },
};

let sharedRoom: Room | null = null;

export function useAutoConnectRoom(options?: RoomOptions): Room {
  const isReady = useRoomReady();
  const livekitInfo = useLivekitInfo();
  const sdk = useSdk();

  const room = useMemo(() => {
    if (!sharedRoom) {
      const mergedOptions = { ...defaultVideoOptions, ...options };
      sharedRoom = new Room(mergedOptions);
    } else if (options) {
      logger.debug("Room already exists, ignoring new options");
    }
    return sharedRoom;
  }, [options]);

  const handleConnection = useCallback(async () => {
    if (!room || !isReady || !livekitInfo) {
      return;
    }

    if (room.state === "connected" || room.state === "connecting") {
      return;
    }

    try {
      logger.debug("Connecting to LiveKit room", {
        url: livekitInfo.url,
        roomName: livekitInfo.roomName,
      });

      await room.connect(livekitInfo.url, livekitInfo.token);
      logger.debug("Successfully connected to LiveKit room");
      
      // Initialize both audio and video tracks but keep them disabled
      // Users must explicitly enable them via UI controls
      await room.localParticipant.setMicrophoneEnabled(false);
      await room.localParticipant.setCameraEnabled(false);

      sdk.livekit.attach(room);
      logger.debug("Attached LiveKit room manager");
    } catch (error) {
      logger.error("Failed to connect to LiveKit room", error);
    }
  }, [room, isReady, livekitInfo, sdk]);

  useEffect(() => {
    handleConnection().then((r) => {});
  }, [handleConnection]);

  return room;
}
