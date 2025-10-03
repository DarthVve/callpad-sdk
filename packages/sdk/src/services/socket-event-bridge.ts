import type { SocketManager } from "../core";
import {
  callAcceptedSchema,
  callEndedSchema,
  callIncomingSchema,
  callJoinInfoSchema,
  participantLeftSchema,
} from "../core/socketio/schema";
import type { LiveKitService } from "../livekit";
import {
  pushIdentityGuardError,
  pushLiveKitConnectError,
  pushSocketValidationError,
  pushStaleEventError,
} from "../state/errors";
import { rtcStore } from "../state/store";

export interface SocketEventBridgeOptions {
  livekitUrl: string | undefined;
  log:
    | ((
        lvl: "debug" | "info" | "warn" | "error",
        msg: string,
        extra?: any
      ) => void)
    | undefined;
}

export function setupSocketEventBridge(
  socket: SocketManager,
  opts: SocketEventBridgeOptions = {
    livekitUrl: undefined,
    log: undefined,
  },
  livekit?: LiveKitService
): () => void {
  const unsubscribers: Array<() => void> = [];

  // Handle incoming call with validation
  unsubscribers.push(
    socket.events.on("call.incoming", (rawData: unknown) => {
      opts.log?.("info", "Incoming call received", rawData);

      // Validate payload
      const result = callIncomingSchema.safeParse(rawData);
      if (!result.success) {
        pushSocketValidationError(
          "call.incoming",
          result.error.issues,
          rawData,
          opts.log
        );
        return;
      }

      const data = result.data;

      // Find caller from participants array
      const caller = data.participants.find(
        (p) => p.role === "CALLER" || p.role === "HOST"
      );
      if (!caller) {
        opts.log?.(
          "error",
          "Invalid call.incoming event: no caller found in participants",
          data
        );
        return;
      }

      rtcStore.getState().patch((state) => {
        state.incomingCall = {
          callId: data.callId,
          caller: {
            id: caller.id,
            name: caller.profile?.firstName || "Unknown",
            avatarUrl: caller.profile?.profilePhoto || undefined,
          },
          type: data.type,
          timestamp: data.timestamp,
        };
        state.session = {
          id: data.callId,
          status: "RINGING",
          mode: data.type,
        };

        // Hydrate profiles from participants array
        for (const participant of data.participants) {
          state.profiles[participant.id] = {
            id: participant.id,
            firstName: participant.profile?.firstName || undefined,
            lastName: participant.profile?.lastName || undefined,
            avatarUrl: participant.profile?.profilePhoto || undefined,
          };
          state.presence[participant.id] = {
            role: participant.role || "MEMBER",
            invite:
              participant.role === "CALLER" || participant.role === "HOST"
                ? "ACCEPTED"
                : "INVITED",
            join: "NOT_JOINED",
            invitedAt: data.timestamp,
          };
        }
      });
    })
  );

  unsubscribers.push(
    socket.events.on("call.accepted", (rawData: unknown) => {
      opts.log?.("info", "Call accepted", rawData);

      // Validate payload
      const result = callAcceptedSchema.safeParse(rawData);
      if (!result.success) {
        pushSocketValidationError(
          "call.accepted",
          result.error.issues,
          rawData,
          opts.log
        );
        return;
      }

      const data = result.data;

      rtcStore.getState().patch((state) => {
        // Guard: Only process if for current session
        if (state.session.id !== data.callId) {
          pushStaleEventError(
            "call.accepted",
            "callId mismatch",
            {
              eventCallId: data.callId,
              sessionCallId: state.session.id,
            },
            opts.log
          );
          return;
        }

        state.session.status = "ACCEPTED";

        // Update accepting participant's presence
        const participant = state.presence[data.by.id];
        if (participant) {
          participant.invite = "ACCEPTED";
          participant.acceptedAt = data.by.acceptedAt || Date.now();
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
          state.session.status = "IDLE";
          state.incomingCall = undefined;
        }
      });
    })
  );

  // Handle participant left (call continues)
  unsubscribers.push(
    socket.events.on("call.participant-left", (rawData: unknown) => {
      opts.log?.("info", "Participant left call", rawData);

      // Validate payload
      const result = participantLeftSchema.safeParse(rawData);
      if (!result.success) {
        pushSocketValidationError(
          "call.participant-left",
          result.error.issues,
          rawData,
          opts.log
        );
        return;
      }

      const data = result.data;

      rtcStore.getState().patch((state) => {
        // Guard: Only process if for current session
        if (state.session.id !== data.callId) {
          pushStaleEventError(
            "call.participant-left",
            "callId mismatch",
            {
              eventCallId: data.callId,
              sessionCallId: state.session.id,
            },
            opts.log
          );
          return;
        }

        // Update participant presence to left
        const participant = state.presence[data.participant.id];
        if (participant) {
          participant.join = "LEFT";
          participant.leftAt = data.timestamp || Date.now();
        }

        // Participant removed from presence tracking above
      });

      // If we are the one leaving, disconnect from LiveKit
      const isLocalParticipant =
        livekit?.room.localParticipant?.identity === data.participant.id;
      if (isLocalParticipant && livekit) {
        livekit.disconnect().catch((error) => {
          opts.log?.(
            "error",
            "Error disconnecting from LiveKit after self-leave",
            error
          );
        });
      }
    })
  );

  // Handle call ended (terminates for everyone)
  unsubscribers.push(
    socket.events.on("call.ended", (rawData: unknown) => {
      opts.log?.("info", "Call ended", rawData);

      // Validate payload
      const result = callEndedSchema.safeParse(rawData);
      if (!result.success) {
        pushSocketValidationError(
          "call.ended",
          result.error.issues,
          rawData,
          opts.log
        );
        return;
      }

      const data = result.data;

      rtcStore.getState().patch((state) => {
        // Guard: Only process if for current session
        if (state.session.id !== data.callId) {
          pushStaleEventError(
            "call.ended",
            "callId mismatch",
            {
              eventCallId: data.callId,
              sessionCallId: state.session.id,
            },
            opts.log
          );
          return;
        }

        state.session.status = "ENDED";
        state.incomingCall = undefined;

        // Mark all participants as left
        for (const id of Object.keys(state.presence)) {
          const participant = state.presence[id];
          if (participant) {
            participant.join = "LEFT";
            if (!participant.leftAt) {
              participant.leftAt = Date.now();
            }
          }
        }

        // All participants marked as left above in presence tracking
      });

      // Disconnect from LiveKit if connected
      if (livekit) {
        livekit.disconnect().catch((error) => {
          opts.log?.("error", "Error disconnecting from LiveKit", error);
        });
      }
    })
  );

  // Handle join info (LiveKit credentials) with strict guards
  unsubscribers.push(
    socket.events.on("call.join-info", async (rawData: unknown) => {
      opts.log?.("info", "Received join info", rawData);

      // Validate payload
      const result = callJoinInfoSchema.safeParse(rawData);
      if (!result.success) {
        pushSocketValidationError(
          "call.join-info",
          result.error.issues,
          rawData,
          opts.log
        );
        return;
      }

      const data = result.data;
      const recipientId = data.for.id;

      const currentSessionId = rtcStore.getState().session.id;
      if (currentSessionId !== data.callId) {
        pushStaleEventError(
          "call.join-info",
          "callId mismatch",
          {
            eventCallId: data.callId,
            sessionCallId: currentSessionId,
          },
          opts.log
        );
        return;
      }

      if (livekit?.room.state === "connected") {
        opts.log?.("warn", "Already connected to LiveKit, ignoring join-info");
        return;
      }

      rtcStore.getState().patch((state) => {
        state.session.livekitInfo = {
          token: data.token,
          roomName: data.roomName,
          callId: data.callId,
        };

        // Update recipient presence to joining
        if (state.presence[recipientId]) {
          state.presence[recipientId].join = "JOINING";
        }
      });

      // Attempt LiveKit connection
      if (livekit) {
        try {
          const roomUrl = opts.livekitUrl || data.url;
          if (!roomUrl) {
            throw new Error("LiveKit URL not provided in options or join info");
          }

          opts.log?.("info", "Auto-joining LiveKit room", {
            url: roomUrl,
            callId: data.callId,
          });

          await livekit.joinRoom(data.token, roomUrl);
          opts.log?.("info", "Successfully auto-joined LiveKit room");

          // Update state on successful connection
          rtcStore.getState().patch((state) => {
            state.session.status = "ACTIVE";
            if (state.presence[recipientId]) {
              state.presence[recipientId].join = "JOINED";
              state.presence[recipientId].joinedAt = Date.now();
            }
          });
        } catch (error) {
          opts.log?.("error", "Failed to auto-join LiveKit room", error);

          // Revert state on connection failure
          rtcStore.getState().patch((state) => {
            if (state.presence[recipientId]) {
              state.presence[recipientId].join = "NOT_JOINED";
            }
          });

          pushLiveKitConnectError(
            error instanceof Error ? error.message : "Unknown error",
            error,
            opts.log
          );
        }
      } else {
        pushLiveKitConnectError(
          "LiveKit service not available",
          null,
          opts.log
        );
      }
    })
  );

  // Return cleanup function
  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
