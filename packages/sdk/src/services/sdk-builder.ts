import { SignalClient } from "../clients/signal";
import { apiConfig } from "../clients/signal/config";
import type { ApiConfig } from "../clients/signal/types";
import { AuthManager, SocketManager } from "../core";
import { rtcStore } from "../state/store";
import { type LogLevel, setGlobalLoggerOptions } from "../utils/logger";
import { type CallsServiceInstance, createCallsService } from "./calls.service";

export interface SdkBuildOptions {
  appId: string;
  signalHost: string;
  authProvider: () => string | null;

  // Logging configuration
  logLevel?: LogLevel;
  enableDebug?: boolean;

  // Custom log callback
  log?: (level: LogLevel, message: string, meta?: any) => void;
}

export interface RtcSdk {
  store: typeof rtcStore;
  auth: AuthManager;
  socket: SocketManager;
  calls: CallsServiceInstance;
  signal: SignalClient;
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
  const auth = new AuthManager(opts.authProvider);
  const socket = SocketManager.getInstance();
  const callsService = createCallsService({ appId: opts.appId });

  // Initialize signal client with same configuration
  const signalClient = new SignalClient({
    baseUrl: opts.signalHost,
    appId: opts.appId,
    token: async () => {
      const token = auth.getCurrentToken();
      return token || "";
    },
  });

  // Configure API immediately with the signal host and auth provider
  // This ensures API is ready before any requests are made
  apiConfig.configure({
    baseUrl: opts.signalHost,
    token: async () => {
      const token = auth.getCurrentToken();
      return token || "";
    },
  });

  // Socket now handles events directly - no event bridge needed

  const cleanup = () => {
    socket.destroy();
    rtcStore.getState().reset();
  };

  return {
    store: rtcStore,
    auth,
    socket,
    calls: callsService,
    signal: signalClient,
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
