export type AuthProvider = () => string | null;

export interface TokenInfo {
  token: string;
  isExpired: boolean;
  expiresAt?: number | undefined;
}

export interface JWTPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: any;
}

export type Nullable<T> = T | null;
