import { OpenAPI } from "../../generated/api";
import { createLogger } from "../../utils";
import type { ApiConfig } from "./types";

const logger = createLogger("api-config");

export class OpenApiConfigService {
  private static instance: OpenApiConfigService;

  private constructor() {
    // Add request interceptor to log authorization headers
    OpenAPI.interceptors.request.use((request) => {
      // Request headers can be Headers object or plain object
      const headers = request.headers as Headers | Record<string, string>;
      let authHeader: string | null = null;

      if (headers instanceof Headers) {
        authHeader = headers.get("Authorization") || null;
      } else if (headers && typeof headers === "object") {
        authHeader = (headers as Record<string, string>).Authorization || null;
      }

      if (authHeader) {
        logger.debug("API Request with Authorization header", {
          hasAuth: true,
          authPrefix: `${authHeader.substring(0, 20)}...`,
        });
      } else {
        logger.warn("API Request WITHOUT Authorization header", {
          hasAuth: false,
        });
      }

      return request;
    });
  }

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
        const token = typeof result === "string" ? result : await result;

        if (!token) {
          logger.warn("Token provider returned empty token");
        } else {
          logger.debug("Token resolved successfully", {
            tokenPrefix: `${token.substring(0, 10)}...`,
          });
        }

        return token;
      };
    } else {
      OpenAPI.TOKEN = config.token;
    }

    OpenAPI.CREDENTIALS = config.credentials ?? "include";
    OpenAPI.WITH_CREDENTIALS = config.withCredentials ?? false;

    if (config.headers) {
      OpenAPI.HEADERS = config.headers;
    }

    logger.info("Signal svc configuration completed", {
      baseUrl: config.baseUrl,
      hasToken: !!config.token,
    });
  }
}

export const apiConfig = OpenApiConfigService.getInstance();

export { OpenAPI };

// Re-export ApiConfig type
export type { ApiConfig } from "./types/api.types";
