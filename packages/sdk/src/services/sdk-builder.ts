import { AuthManager, SocketManager } from "../core";
import { SignalClient } from "../core/signal";
import { rtcStore } from "../state/store";
import { type CallActions, createCallActions } from "./call-actions";
import { setupSocketEventBridge } from "./socket-event-bridge";
import type { SocketEvents } from "../core/socketio/types";

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
  // livekit: ReturnType<typeof createLiveKitService>; // Added in Chunk B
  cleanup: () => void;
  
  // Convenience methods for event listening
  /**
   * Subscribe to a network event. Shortcut for sdk.socket.events.on()
   * @param event - The event name to listen for
   * @param handler - The callback function to handle the event data
   * @returns A function to unsubscribe from the event
   */
  on<K extends keyof SocketEvents>(
    event: K,
    handler: (data: SocketEvents[K]) => void
  ): () => void;
  
  /**
   * Unsubscribe from a network event. Shortcut for sdk.socket.events.off()
   * @param event - The event name to unsubscribe from
   * @param handler - The callback function to remove
   */
  off<K extends keyof SocketEvents>(
    event: K,
    handler: (data: SocketEvents[K]) => void
  ): void;
}

/**
 * Builds the complete SDK with all services wired together
 * Central factory for creating SDK instances
 */
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

  // Set up socket event bridge and get cleanup function
  const cleanupEventBridge = setupSocketEventBridge(socket, { log: opts.log });

  // Create call actions with state management
  const callActions = createCallActions(signal);

  // Cleanup function for SDK teardown
  const cleanup = () => {
    cleanupEventBridge();
    socket.destroy();
    signal.destroy();
    rtcStore.getState().reset();
  };

  return {
    store: rtcStore,
    auth,
    socket,
    signal,
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
