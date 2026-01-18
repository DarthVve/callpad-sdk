export type AuthProvider = () => string | null;

export interface TokenInfo {
  token: string;
  isExpired: boolean;
  expiresAt?: number | undefined;
}

export interface SessionInfo {
  sessionToken: string;
  sessionId: string;
  userId: string;
  deviceId: string;
  expiresAt: string;
}

export type Nullable<T> = T | null;

export interface AuthRetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}
