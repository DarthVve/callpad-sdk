import { AuthManager, SocketManager } from "../core";
import { type ApiConfig, SignalClient, apiConfig } from "../core/signal";
import { LiveKitService } from "../livekit";
import { rtcStore } from "../state/store";
import { type LogLevel, setGlobalLoggerOptions } from "../utils/logger";
import { type CallActions, createCallActions } from "./call-actions";

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

export interface RtcSdk extends CallActions {
  store: typeof rtcStore;
  auth: AuthManager;
  socket: SocketManager;
  signal: SignalClient;
  livekit: LiveKitService;
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
  const signal = new SignalClient({
    baseUrl: opts.signalHost,
    appId: opts.appId,
    authManager: auth,
  });

  const livekit = new LiveKitService({
    log: opts.log,
    appId: opts.appId,
  });

  const callActions = createCallActions(signal, auth, livekit);

  // Socket now handles events directly - no event bridge needed

  const cleanup = () => {
    socket.destroy();
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

    // API configuration
    configureApi: (config: ApiConfig) => {
      apiConfig.configure(config);
    },
  };
}
