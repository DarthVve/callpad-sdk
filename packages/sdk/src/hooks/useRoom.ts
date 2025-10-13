import { useState, useEffect } from "react";
import {Room, type RoomOptions} from "livekit-client";
import { useRtcStore } from "../state/store";

const defaultRoomOptions = {
  adaptiveStream: true,
  dynacast: true,
};

export function useRoom(options?: RoomOptions): Room | null {
  const [room] = useState(() => new Room(options || defaultRoomOptions));
  const livekitInfo = useRtcStore((state) => state.session?.livekitInfo);

  useEffect(() => {
    if (!livekitInfo) {
      return;
    }

    room.connect(livekitInfo.url, livekitInfo.token);
    return () => {
      room.disconnect();
    };
  }, [livekitInfo, room]);

  if (!livekitInfo) {
    return null;
  }

  return room;
}
