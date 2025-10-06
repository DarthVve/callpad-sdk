import type { AuthProvider, Nullable } from "./types";

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
}
