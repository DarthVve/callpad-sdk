// Core managers (for advanced usage)
export * from "./core";
export { SignalClient } from "./core/signal/signal.client";
export type { InitiateCallParams, CallResponse } from "./core/signal/types";

// Socket event types for external listeners
export type { SocketEvents } from "./core/socketio/types";

// State management
export * from "./state/types";
export { useRtcStore, rtcStore } from "./state/store";

// Services (for advanced usage)
export * from "./services";

// Provider & Context
export {
  RtcProvider,
  useSdk,
  type RtcOptions,
  type RtcSdk,
} from "./provider/RtcProvider";

// Hooks
export * from "./hooks";
