import type { AuthProvider, Nullable, JWTPayload } from "./types";

export class AuthManager {
  private readonly authProvider: AuthProvider;
  private lastToken: Nullable<string> = null;

  constructor(authProvider: AuthProvider) {
    this.authProvider = authProvider;
  }

  getCurrentToken(): string | null {
    const token = this.authProvider();
    if (token !== this.lastToken) {
      this.lastToken = token;
    }

    return token;
  }

  /**
   * Extract user ID from JWT token
   */
  getCurrentUserId(): string | null {
    const token = this.getCurrentToken();
    if (!token) return null;

    try {
      const payload = this.decodeJWT(token);
      return payload?.sub || payload?.userId || payload?.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Decode JWT token without verification
   */
  private decodeJWT(token: string): JWTPayload | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const payload = parts[1]?.replace(/-/g, '+').replace(/_/g, '/');
      if (!payload) return null;
      
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload as JWTPayload;
    } catch {
      return null;
    }
  }
}
