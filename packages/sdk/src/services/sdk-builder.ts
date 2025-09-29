import { AuthManager, SocketManager } from "../core";
import { SignalClient } from "../core/signal";
import type { SocketEvents } from "../core/socketio/types";
import { LiveKitService } from "../livekit";
import { rtcStore } from "../state/store";
import { type CallActions, createCallActions } from "./call-actions";
import { setupSocketEventBridge } from "./socket-event-bridge";

export interface SdkBuildOptions {
  appId: string;
  restBaseUrl: string;
  socketUrl: string;
  livekitUrl?: string;
  authProvider: () => string | null;
  log?: (
    lvl: "debug" | "info" | "warn" | "error",
    msg: string,
    extra?: any
  ) => void;
}

export interface RtcSdk extends CallActions {
  store: typeof rtcStore;
  auth: AuthManager;
  socket: SocketManager;
  signal: SignalClient;
  livekit: LiveKitService;
  cleanup: () => void;

  on<K extends keyof SocketEvents>(
    event: K,
    handler: (data: SocketEvents[K]) => void
  ): () => void;

  off<K extends keyof SocketEvents>(
    event: K,
    handler: (data: SocketEvents[K]) => void
  ): void;
}

export function buildSdk(opts: SdkBuildOptions): RtcSdk {
  // Initialize core managers
  const auth = new AuthManager(opts.authProvider);
  const socket = SocketManager.getInstance();
  const signal = new SignalClient({
    baseUrl: opts.restBaseUrl,
    appId: opts.appId,
    authManager: auth,
    socketManager: socket,
  });

  const callActions = createCallActions(signal);

  const livekit = new LiveKitService({
    livekitUrl: opts.livekitUrl,
    log: opts.log,
  });

  const cleanupEventBridge = setupSocketEventBridge(
    socket,
    {
      log: opts.log,
      livekitUrl: opts.livekitUrl,
    },
    livekit
  );

  const cleanup = () => {
    cleanupEventBridge();
    socket.destroy();
    signal.destroy();
    livekit.destroy();
    rtcStore.getState().reset();
  };

  return {
    store: rtcStore,
    auth,
    socket,
    signal,
    livekit,
    ...callActions,
    cleanup,

    // Convenience methods for event listening
    on<K extends keyof SocketEvents>(
      event: K,
      handler: (data: SocketEvents[K]) => void
    ) {
      return socket.events.on(event, handler);
    },

    off<K extends keyof SocketEvents>(
      event: K,
      handler: (data: SocketEvents[K]) => void
    ) {
      socket.events.off(event, handler);
    },
  };
}
