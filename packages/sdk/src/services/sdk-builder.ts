import { SignalClient } from "../clients/signal";
import { apiConfig } from "../clients/signal/config";
import type { ApiConfig } from "../clients/signal/types";
import { AuthManager, SocketManager } from "../core";
import type { PresenceConfig } from "../state/presence.types";
import type { AuthRetryConfig } from "../core/types";
import { rtcStore } from "../state/store";
import { type LogLevel, setGlobalLoggerOptions } from "../utils/logger";
import { type CallsServiceInstance, createCallsService } from "./calls.service";
import { LiveKitRoomManager } from "./livekitRoomManager";
import {
  type PresenceServiceInstance,
  createPresenceService,
} from "./presence.service";

export interface SdkBuildOptions {
  appId: string;
  signalHost: string;
  authProvider: () => string | null;

  // Logging configuration
  logLevel?: LogLevel;
  enableDebug?: boolean;

  // Custom log callback
  log?: (level: LogLevel, message: string, meta?: any) => void;

  // Auth retry configuration (for handling transient token unavailability)
  authRetry?: Partial<AuthRetryConfig>;

  presence?: Partial<PresenceConfig>;
}

export interface RtcSdk {
  store: typeof rtcStore;
  auth: AuthManager;
  socket: SocketManager;
  calls: CallsServiceInstance;
  signal: SignalClient;
  livekit: LiveKitRoomManager;
  presence: PresenceServiceInstance;
  cleanup: () => void;

  configureApi: (config: ApiConfig) => void;
}

export function buildSdk(opts: SdkBuildOptions): RtcSdk {
  // Configure global logging system
  const loggerOptions: any = {};
  if (opts.logLevel !== undefined) {
    loggerOptions.level = opts.logLevel;
  }
  if (opts.enableDebug !== undefined) {
    loggerOptions.enableDebug = opts.enableDebug;
  }
  if (opts.log !== undefined) {
    loggerOptions.customLogger = opts.log;
  }
  setGlobalLoggerOptions(loggerOptions);

  // Initialize core managers
  const auth = new AuthManager(opts.authProvider, opts.appId, opts.authRetry);

  const socket = SocketManager.getInstance();
  const livekitManager = new LiveKitRoomManager();
  const callsService = createCallsService(
    { appId: opts.appId },
    { livekitManager, authManager: auth }
  );

  // Initialize signal client with session token configuration
  const signalClient = new SignalClient({
    baseUrl: opts.signalHost,
    appId: opts.appId,
    token: async () => {
      const token = await auth.getSessionToken();
      return token || "";
    },
  });

  // Configure API with base URL and session token provider
  // This ensures all API calls use session tokens consistently
  apiConfig.configure({
    baseUrl: opts.signalHost,
    token: async () => {
      const token = await auth.getSessionToken();
      return token || "";
    },
  });

  const presenceService = createPresenceService(
    { appId: opts.appId },
    { getSocket: () => socket.getSocket() }
  );

  if (opts.presence) {
    presenceService.configure(opts.presence);
  }

  socket.setPresenceService(presenceService);

  const cleanup = () => {
    presenceService.destroy();
    livekitManager.detach();
    socket.destroy();
    rtcStore.getState().reset();
  };

  return {
    store: rtcStore,
    auth,
    socket,
    calls: callsService,
    signal: signalClient,
    livekit: livekitManager,
    presence: presenceService,
    cleanup,

    // API configuration - can be called again to override if needed
    configureApi: (config: ApiConfig) => {
      apiConfig.configure(config);
      // Also reconfigure signal client with only defined values
      const signalConfig: Partial<ApiConfig> = {
        baseUrl: config.baseUrl,
      };
      if (config.token !== undefined) {
        signalConfig.token = config.token;
      }
      if (config.credentials !== undefined) {
        signalConfig.credentials = config.credentials;
      }
      if (config.withCredentials !== undefined) {
        signalConfig.withCredentials = config.withCredentials;
      }
      if (config.headers !== undefined) {
        signalConfig.headers = config.headers;
      }
      signalClient.reconfigure(signalConfig);
    },
  };
}
