export interface ApiConfig {
  baseUrl: string;
  token?: string | (() => Promise<string> | string);
  credentials?: "include" | "omit" | "same-origin";
  withCredentials?: boolean;
  headers?: Record<string, string>;
}