import { z } from "zod";

// Common participant profile schema for socket events
export const participantProfileSchema = z.object({
  id: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  profilePhoto: z.string().nullable().optional(),
});

// Participant with role for socket events
export const socketParticipantSchema = z.object({
  id: z.string(),
  profile: participantProfileSchema.optional(),
  role: z.enum(["CALLER", "CALLEE", "HOST", "MEMBER"]).optional(),
});

// call.incoming event schema
export const callIncomingSchema = z.object({
  callId: z.string(),
  type: z.enum(["AUDIO", "VIDEO"]),
  participants: z.array(socketParticipantSchema).min(1), // Required, at least 1 participant
  timestamp: z.number(),
});

// call.accepted event schema
export const callAcceptedSchema = z.object({
  callId: z.string(),
  by: z.object({
    id: z.string(),
    acceptedAt: z.number().optional(),
  }),
});

// call.join-info event schema
export const callJoinInfoSchema = z.object({
  callId: z.string(),
  for: z.object({
    id: z.string(),
  }),
  token: z.string(),
  url: z.string().optional(),
  roomName: z.string(),
  expiresAt: z.number().optional(),
});

// call.ended event schema
export const callEndedSchema = z.object({
  callId: z.string(),
  reason: z.enum(["ENDED", "TIMEOUT", "CANCELLED", "ERROR"]).optional(),
  timestamp: z.number().optional(),
  endedBy: z.string().optional(),
});

// call.participant-left event schema
export const participantLeftSchema = z.object({
  callId: z.string(),
  participant: z.object({
    id: z.string(),
    name: z.string().optional(),
  }),
  timestamp: z.number().optional(),
});

// Optional participant.joined event schema (for future use)
export const participantJoinedSchema = z.object({
  callId: z.string(),
  participant: z.object({
    id: z.string(),
    name: z.string().optional(),
  }),
  timestamp: z.number().optional(),
});

// Inferred types for use in handlers
export type CallIncomingEvent = z.infer<typeof callIncomingSchema>;
export type CallAcceptedEvent = z.infer<typeof callAcceptedSchema>;
export type CallJoinInfoEvent = z.infer<typeof callJoinInfoSchema>;
export type CallEndedEvent = z.infer<typeof callEndedSchema>;
export type ParticipantLeftEvent = z.infer<typeof participantLeftSchema>;
export type ParticipantJoinedEvent = z.infer<typeof participantJoinedSchema>;
