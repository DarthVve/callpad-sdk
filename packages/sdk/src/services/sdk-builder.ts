import { type GuestJoinResponse, SignalClient } from "../clients/signal";
import { apiConfig } from "../clients/signal/config";
import type { ApiConfig } from "../clients/signal/types";
import { AuthManager, GuestAuthManager, SocketManager } from "../core";
import type { AuthRetryConfig } from "../core/types";
import type { PresenceConfig } from "../state/presence.types";
import { rtcStore } from "../state/store";
import { type LogLevel, setGlobalLoggerOptions } from "../utils/logger";
import { type CallsServiceInstance, createCallsService } from "./calls.service";
import { LiveKitRoomManager } from "./livekitRoomManager";
import {
  type GuestJoinMeetingParams,
  type MeetingsServiceInstance,
  createMeetingsService,
} from "./meetings.service";
import {
  type PresenceServiceInstance,
  createPresenceService,
} from "./presence.service";

export interface SdkBuildOptionsBase {
  appId: string;
  signalHost: string;
  logLevel?: LogLevel;
  enableDebug?: boolean;
  log?: (level: LogLevel, message: string, meta?: any) => void;
  presence?: Partial<PresenceConfig>;
}

export interface AuthenticatedSdkOptions extends SdkBuildOptionsBase {
  mode?: "authenticated";
  authProvider: () => string | null;
  authRetry?: Partial<AuthRetryConfig>;
}

export interface GuestSdkOptions extends SdkBuildOptionsBase {
  mode: "guest";
  deviceId: string;
}

export type SdkBuildOptions = AuthenticatedSdkOptions | GuestSdkOptions;

export interface RtcSdk {
  store: typeof rtcStore;
  auth: AuthManager;
  socket: SocketManager;
  calls: CallsServiceInstance;
  meetings: MeetingsServiceInstance;
  signal: SignalClient;
  livekit: LiveKitRoomManager;
  presence: PresenceServiceInstance;
  cleanup: () => void;
  configureApi: (config: ApiConfig) => void;
}

export interface GuestRtcSdk {
  store: typeof rtcStore;
  auth: GuestAuthManager;
  socket: SocketManager;
  meetings: MeetingsServiceInstance;
  livekit: LiveKitRoomManager;
  presence: PresenceServiceInstance;
  cleanup: () => void;
  configureApi: (config: ApiConfig) => void;
  guestJoin: (params: GuestJoinMeetingParams) => Promise<GuestJoinResponse>;
}

export function buildSdk(opts: AuthenticatedSdkOptions): RtcSdk {
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

  const auth = new AuthManager(opts.authProvider, opts.appId, opts.authRetry);

  const socket = SocketManager.getInstance();
  const livekitManager = new LiveKitRoomManager();
  const callsService = createCallsService(
    { appId: opts.appId },
    { livekitManager, authManager: auth }
  );
  const meetingsService = createMeetingsService(
    { appId: opts.appId },
    { livekitManager }
  );

  const signalClient = new SignalClient({
    baseUrl: opts.signalHost,
    appId: opts.appId,
    token: async () => {
      const token = await auth.getSessionToken();
      return token || "";
    },
  });

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
    meetings: meetingsService,
    signal: signalClient,
    livekit: livekitManager,
    presence: presenceService,
    cleanup,
    configureApi: (config: ApiConfig) => {
      apiConfig.configure(config);
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

export function buildGuestSdk(opts: GuestSdkOptions): GuestRtcSdk {
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

  const auth = new GuestAuthManager(opts.appId, opts.deviceId);
  const socket = SocketManager.getInstance();
  const livekitManager = new LiveKitRoomManager();
  const meetingsService = createMeetingsService(
    { appId: opts.appId },
    { livekitManager }
  );

  apiConfig.configure({
    baseUrl: opts.signalHost,
    token: async () => (await auth.getSessionToken()) || "",
  });

  const presenceService = createPresenceService(
    { appId: opts.appId },
    { getSocket: () => socket.getSocket() }
  );

  if (opts.presence) {
    presenceService.configure(opts.presence);
  }

  socket.setPresenceService(presenceService);

  const guestJoin = async (
    params: GuestJoinMeetingParams
  ): Promise<GuestJoinResponse> => {
    const response = await meetingsService.guestJoin(params, {
      deviceId: opts.deviceId,
      signalHost: opts.signalHost,
      onSessionToken: async (sessionToken: string) => {
        auth.setSession({
          sessionToken,
          guestId: response.guestId,
          displayName: params.displayName,
          callId: response.meeting.callId,
          meetingId: response.meeting.id,
          meetingCode: response.meeting.code,
        });
        await socket.initializeWithToken(opts.signalHost, sessionToken);
      },
    });
    return response;
  };

  const cleanup = () => {
    presenceService.destroy();
    livekitManager.detach();
    socket.destroy();
    auth.clearSession();
    rtcStore.getState().reset();
  };

  return {
    store: rtcStore,
    auth,
    socket,
    meetings: meetingsService,
    livekit: livekitManager,
    presence: presenceService,
    cleanup,
    configureApi: (config: ApiConfig) => {
      apiConfig.configure(config);
    },
    guestJoin,
  };
}
