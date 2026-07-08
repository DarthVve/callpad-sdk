import { SessionStorage } from "./session-storage";

export interface GuestSessionInfo {
  sessionToken: string;
  guestId: string;
  displayName: string;
  callId: string;
  meetingId: string;
  meetingCode: string;
}

export class GuestAuthManager {
  private readonly sessionStorage: SessionStorage<GuestSessionInfo>;
  private readonly appId: string;
  private readonly deviceId: string;

  constructor(appId: string, deviceId: string) {
    this.appId = appId;
    this.deviceId = deviceId;
    this.sessionStorage = new SessionStorage<GuestSessionInfo>(
      "callpad_guest_session"
    );
  }

  getAppId(): string {
    return this.appId;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  setSession(session: GuestSessionInfo): void {
    this.sessionStorage.set(session);
  }

  async getSessionToken(): Promise<string | null> {
    return this.sessionStorage.get()?.sessionToken || null;
  }

  getSessionInfo(): GuestSessionInfo | null {
    return this.sessionStorage.get();
  }

  clearSession(): void {
    this.sessionStorage.clear();
  }
}
