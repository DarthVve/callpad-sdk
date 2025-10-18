import type { ApiConfig } from "../../core/signal/types";

export interface SignalClientConfig {
  baseUrl: string;
  appId: string;
  token?: string | (() => Promise<string> | string);
  credentials?: "include" | "omit" | "same-origin";
  withCredentials?: boolean;
  headers?: Record<string, string>;
}

export interface SignalClientOptions {
  config: SignalClientConfig;
}

// Re-export API config type for convenience
export type { ApiConfig };