import { nanoid } from "nanoid";
import type { ChatEntry, Envelope } from "./types";

export function compareEntries(a: ChatEntry, b: ChatEntry): number {
  if (a.createdAt !== b.createdAt) {
    return a.createdAt - b.createdAt;
  }
  
  if (a.sender.id !== b.sender.id) {
    return a.sender.id.localeCompare(b.sender.id);
  }
  
  return a.id.localeCompare(b.id);
}

export function validateContent(content: string): { valid: boolean; error?: string } {
  const trimmed = content.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: "Content cannot be empty" };
  }
  
  const sizeInBytes = new TextEncoder().encode(content).length;
  if (sizeInBytes > 16384) {
    return { valid: false, error: "Content exceeds 16KB limit" };
  }
  
  return { valid: true };
}

export function isValidEnvelope(data: any): data is Envelope {
  if (!data || typeof data !== "object") {
    return false;
  }
  
  if (data.v !== 1) {
    return false;
  }
  
  if (!["entry", "edit", "remove", "reaction"].includes(data.kind)) {
    return false;
  }
  
  if (
    typeof data.roomId !== "string" ||
    typeof data.entryId !== "string" ||
    typeof data.ts !== "number"
  ) {
    return false;
  }
  
  if (!data.sender || typeof data.sender.id !== "string") {
    return false;
  }
  
  if (data.kind === "entry" || data.kind === "edit" || data.kind === "reaction") {
    if (!data.payload || typeof data.payload !== "object") {
      return false;
    }
  }
  
  return true;
}

export function generateEntryId(): string {
  return nanoid();
}

export function getCurrentTimestamp(): number {
  return Date.now();
}
