import type { SocketManager } from "../core";
import type { IncomingCallEvent } from "../core/signal";
import { rtcStore } from "../state/store";

export interface SocketEventBridgeOptions {
  log?: (
    lvl: "debug" | "info" | "warn" | "error",
    msg: string,
    extra?: any
  ) => void;
}

/**
 * Sets up event bridge between socket events and state store
 * Handles all real-time socket events and updates application state accordingly
 */
export function setupSocketEventBridge(
  socket: SocketManager,
  opts: SocketEventBridgeOptions = {}
): () => void {
  const unsubscribers: Array<() => void> = [];

  // Handle incoming call
  unsubscribers.push(
    socket.events.on("call.incoming", (data: IncomingCallEvent) => {
      opts.log?.("info", "Incoming call received", data);

      rtcStore.getState().patch((state) => {
        state.incomingCall = {
          callId: data.callId,
          caller: {
            id: data.fromUserId,
            name: data.fromUserName,
            avatarUrl: data.fromUserAvatar,
          },
          type: data.type,
          timestamp: data.timestamp,
        };
        state.session = {
          id: data.callId,
          status: "ringing",
          mode: data.type,
        };
      });
    })
  );

  // Handle call accepted (by another device/user)
  unsubscribers.push(
    socket.events.on("call.accepted", (data: any) => {
      opts.log?.("info", "Call accepted", data);

      rtcStore.getState().patch((state) => {
        if (state.session.id === data.callId) {
          state.session.status = "accepted";
          // Store LiveKit info for later use (Chunk B)
          if (data.livekitInfo) {
            state.session.livekitInfo = data.livekitInfo;
          }
        }
      });
    })
  );

  // Handle call declined
  unsubscribers.push(
    socket.events.on("call.declined", (data: any) => {
      opts.log?.("info", "Call declined", data);

      rtcStore.getState().patch((state) => {
        if (state.session.id === data.callId) {
          state.session.status = "idle";
          state.incomingCall = undefined;
        }
      });
    })
  );

  // Handle call ended
  unsubscribers.push(
    socket.events.on("call.ended", (data: any) => {
      opts.log?.("info", "Call ended", data);

      rtcStore.getState().patch((state) => {
        if (state.session.id === data.callId) {
          state.session.status = "ended";
          state.incomingCall = undefined;
          // Clear participants and tracks
          state.participants = {};
          state.tracks = {};
        }
      });
    })
  );

  // Handle join info (LiveKit credentials)
  unsubscribers.push(
    socket.events.on("call.join-info", (data: any) => {
      opts.log?.("info", "Received join info", data);

      rtcStore.getState().patch((state) => {
        if (state.session.id === data.callId) {
          state.session.status = "active";
          state.session.livekitInfo = {
            token: data.token,
            roomName: data.roomName,
            callId: data.callId,
          };
        }
      });
    })
  );

  // Return cleanup function
  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
