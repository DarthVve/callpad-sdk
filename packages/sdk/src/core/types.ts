export type AuthProvider = () => string | null;

export interface TokenInfo {
  token: string;
  isExpired: boolean;
  expiresAt?: number | undefined;
}

export type Nullable<T> = T | null;

// Auto-join configuration types
export interface AutoJoinConfig {
  enabled: boolean;
  retryOnFailure: boolean;
  maxRetries: number;
}
