import { createLogger } from "../../utils";

export const logger = createLogger("reactions");

export function validateEmoji(emoji: string): {
  valid: boolean;
  error?: string;
} {
  if (!emoji || typeof emoji !== "string") {
    return { valid: false, error: "empty" };
  }
  if (emoji.length > 10) {
    return { valid: false, error: "too long" };
  }
  return { valid: true };
}

export function generateNonce(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
