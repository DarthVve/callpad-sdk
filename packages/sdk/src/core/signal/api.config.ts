import { OpenAPI } from "../../generated/api";
import type { ApiConfig } from "./types";

export class OpenApiConfigService {
  private static instance: OpenApiConfigService;

  private constructor() {}

  static getInstance(): OpenApiConfigService {
    if (!OpenApiConfigService.instance) {
      OpenApiConfigService.instance = new OpenApiConfigService();
    }
    return OpenApiConfigService.instance;
  }

  configure(config: ApiConfig): void {
    OpenAPI.BASE = config.baseUrl;

    // Handle token - OpenAPI expects string | Resolver<string>
    // Resolver<string> = (options: ApiRequestOptions) => Promise<string>
    if (typeof config.token === "function") {
      const tokenFn = config.token; // Capture the function reference
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

  setToken(token: string): void {
    OpenAPI.TOKEN = token;
  }
}

export const apiConfig = OpenApiConfigService.getInstance();

export { OpenAPI };

// Re-export ApiConfig type
export type { ApiConfig } from "./types";
