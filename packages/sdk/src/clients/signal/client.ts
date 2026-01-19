import { OpenAPI } from "../../generated/api";
import {
  SignalCallsService,
  SignalHealthService,
  SignalPresenceService,
} from "./services";
import type { SignalClientConfig } from "./types";

export class SignalClient {
  public readonly calls: SignalCallsService;
  public readonly health: SignalHealthService;
  public readonly presence: SignalPresenceService;

  constructor(config: SignalClientConfig) {
    this.configure(config);

    // Initialize services
    this.calls = new SignalCallsService(config.appId);
    this.health = new SignalHealthService();
    this.presence = new SignalPresenceService(config.appId);
  }

  private configure(config: SignalClientConfig): void {
    OpenAPI.BASE = config.baseUrl;

    // Handle token - OpenAPI expects string | Resolver<string>
    if (typeof config.token === "function") {
      const tokenFn = config.token;
      OpenAPI.TOKEN = async (_options) => {
        const result = tokenFn();
        return typeof result === "string" ? result : await result;
      };
    } else {
      OpenAPI.TOKEN = config.token;
    }

    OpenAPI.CREDENTIALS = config.credentials ?? "include";
    OpenAPI.WITH_CREDENTIALS = config.withCredentials ?? false;

    if (config.headers) {
      OpenAPI.HEADERS = config.headers;
    }
  }

  public reconfigure(config: Partial<SignalClientConfig>): void {
    // Update existing config with new values
    const newConfig: SignalClientConfig = {
      baseUrl: OpenAPI.BASE,
      appId: this.calls ? (this.calls as any).appId : "",
      credentials: OpenAPI.CREDENTIALS as any,
      withCredentials: OpenAPI.WITH_CREDENTIALS,
      ...config,
    };

    this.configure(newConfig);

    // Update appId in calls service if it changed
    if (config.appId && this.calls) {
      (this.calls as any).appId = config.appId;
    }
  }
}
