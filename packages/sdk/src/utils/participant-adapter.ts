/**
 * Utility functions for extracting caller information from socket event participants
 */

import type { z } from "zod";
import type { socketParticipantSchema } from "../core/socketio/handlers/schema";

// Use the actual socket schema type instead of a separate interface
type SocketParticipant = z.infer<typeof socketParticipantSchema>;

/**
 * Find caller from participants array in socket events
 */
export function findCaller(participants: SocketParticipant[]): SocketParticipant | null {
  return participants.find(p => 
    p.role === "CALLER" || p.role === "HOST"
  ) || null;
}

/**
 * Extract caller info for incoming call events
 */
export function extractCallerInfo(participants: SocketParticipant[]): {
  id: string;
  name: string;
  avatarUrl?: string;
} | null {
  const caller = findCaller(participants);
  if (!caller) return null;
  
  const result: { id: string; name: string; avatarUrl?: string } = {
    id: caller.id,
    name: [caller.firstName, caller.lastName].filter(Boolean).join(" ") || 
          `Guest ${caller.id}`,
  };
  
  if (caller.profilePhoto) {
    result.avatarUrl = caller.profilePhoto;
  }
  
  return result;
}