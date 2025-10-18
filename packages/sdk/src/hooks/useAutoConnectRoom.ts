import {
  Room,
  type RoomOptions,
} from "livekit-client";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { createLogger } from "../utils";
import { useLivekitInfo } from "./useLivekitInfo";
import { useRoomReady } from "./useRoomReady";

const logger = createLogger("useAutoConnectRoom");

export function useAutoConnectRoom(options?: RoomOptions): Room {
  const isReady = useRoomReady();
  const livekitInfo = useLivekitInfo();
  const roomRef = useRef<Room | null>(null);

  const room = useMemo(() => {
    if (!roomRef.current) {
      roomRef.current = new Room(options);
      logger.debug("Created new LiveKit room instance");
    }
    return roomRef.current;
  }, []);

  // Memoize connection handler to prevent re-render loops
  const handleConnection = useCallback(async () => {
    if (room && isReady && livekitInfo) {
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
    }
  }, [room, isReady, livekitInfo]);

  // Handle connection state changes
  useEffect(() => {
    handleConnection();
  }, [handleConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, []);

  return room;
}
