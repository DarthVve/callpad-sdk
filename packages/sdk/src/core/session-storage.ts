import type { Nullable } from "./types";

export class SessionStorage<T> {
  private readonly key: string;

  constructor(key: string) {
    this.key = key;
  }

  set(data: T): void {
    const serialized = JSON.stringify(data);
    sessionStorage.setItem(this.key, serialized);
  }

  get(): Nullable<T> {
    const stored = sessionStorage.getItem(this.key);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as T;
    } catch {
      return null;
    }
  }

  clear(): void {
    sessionStorage.removeItem(this.key);
  }

  exists(): boolean {
    return sessionStorage.getItem(this.key) !== null;
  }
}
