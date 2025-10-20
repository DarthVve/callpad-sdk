import {
  Room,
  type RoomOptions,
} from "livekit-client";
import { useCallback, useEffect, useMemo } from "react";
import { createLogger } from "../utils";
import { useLivekitInfo } from "./useLivekitInfo";
import { useRoomReady } from "./useRoomReady";

const logger = createLogger("useAutoConnectRoom");

let sharedRoom: Room | null = null;

export function useAutoConnectRoom(options?: RoomOptions): Room {
  const isReady = useRoomReady();
  const livekitInfo = useLivekitInfo();

  const room = useMemo(() => {
    if (!sharedRoom) {
      sharedRoom = new Room(options);
      logger.debug("Created singleton LiveKit room instance");
    } else if (options) {
      logger.debug("Room already exists, ignoring new options");
    }
    return sharedRoom;
  }, []);

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
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch (error) {
      logger.error("Failed to connect to LiveKit room", error);
    }
  }, [room, isReady, livekitInfo]);

  useEffect(() => {
    handleConnection().then(r => {});
  }, [handleConnection]);

  return room;
}
