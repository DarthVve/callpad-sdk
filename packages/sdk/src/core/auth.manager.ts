import { jwtDecode } from "jwt-decode";
import type { AuthProvider, JWTPayload, Nullable, TokenInfo } from "./types";

export class AuthManager {
  private readonly authProvider: AuthProvider;
  private lastToken: Nullable<string> = null;
  private lastTokenExpiry: Nullable<number> = null;

  constructor(authProvider: AuthProvider) {
    this.authProvider = authProvider;
  }

  getCurrentToken(): string | null {
    const token = this.authProvider();
    if (token !== this.lastToken) {
      this.lastToken = token;
      this.lastTokenExpiry = token ? this.parseTokenExpiry(token) : null;
    }

    return token;
  }

  isAuthenticated(): boolean {
    const token = this.getCurrentToken();
    if (!token) {
      return false;
    }

    return !this.isTokenExpired(token);
  }

  isTokenExpired(token: string): boolean {
    const expiry = this.parseTokenExpiry(token);
    if (!expiry) {
      return false;
    }

    // Add a 30-second buffer to account for clock skew
    const now = Math.floor(Date.now() / 1000);
    return now >= expiry - 30;
  }

  parseTokenExpiry(token: string): number | null {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      return decoded.exp || null;
    } catch {
      return null;
    }
  }

  hasTokenChanged(): boolean {
    const currentToken = this.getCurrentToken();
    return currentToken !== this.lastToken;
  }

  getTokenInfo(): TokenInfo | null {
    const token = this.getCurrentToken();
    if (!token) {
      return null;
    }

    return {
      token,
      isExpired: this.isTokenExpired(token),
      expiresAt: this.parseTokenExpiry(token) || undefined,
    };
  }
}
