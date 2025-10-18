// Main signal client export
export { SignalClient } from "./client";

// Service exports
export {
  SignalCallsService,
  SignalHealthService,
  SignalPresenceService,
} from "./services";

// React hooks
export {
  SignalServiceProvider,
  useSignalService,
  useSignalClient,
  type SignalServiceProviderProps,
} from "./hooks";

// Types
export type {
  SignalClientConfig,
  SignalClientOptions,
  ApiConfig,
} from "./types";

// Re-export generated API types for convenience
export type {
  CallsData,
  HealthData,
} from "../../generated/api/models";

// Re-export API services if needed for advanced usage
export {
  CallsService,
  HealthService,
} from "../../generated/api";