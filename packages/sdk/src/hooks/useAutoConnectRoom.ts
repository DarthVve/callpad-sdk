import {ConnectionState, LocalTrack, Room, type RoomOptions} from "livekit-client";
import { useEffect, useState } from "react";
import { createLogger } from "../utils/logger";
import { useLivekitInfo } from "./useLivekitInfo";
import { useRoomReady } from "./useRoomReady";
import {Track} from "livekit-client";

const logger = createLogger("useAutoConnectRoom");

/**
 * Automatically connects to the LiveKit room when ready.
 * Monitors credentials and status, handles connection lifecycle and cleanup.
 */
export function useAutoConnectRoom(options?: RoomOptions): Room {
  const [room] = useState(() => new Room(options));
  const isReady = useRoomReady();
  const livekitInfo = useLivekitInfo();

  useEffect(() => {
    if (isReady && livekitInfo) {
      room.connect(livekitInfo.url, livekitInfo.token).catch((error) => {
        logger.error("Failed to connect to LiveKit room", error);
      }).then(() => {
          room.localParticipant.setMicrophoneEnabled(true)
      });
    } else if (room.state === ConnectionState.Connected) {
      room.disconnect();
    }

    return () => {
      room.disconnect();
    };
  }, [isReady, livekitInfo, room]);

  return room;
}
