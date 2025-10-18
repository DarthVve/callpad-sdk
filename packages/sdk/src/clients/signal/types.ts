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

// Re-export all types from the types directory
export * from "./types/index";