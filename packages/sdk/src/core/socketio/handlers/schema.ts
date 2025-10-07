import { z } from "zod";

// Participant with a role for socket events
export const socketParticipantSchema = z.object({
  id: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  username: z.string().nullable(),
  profilePhoto: z.string().nullable(),
  role: z.enum(["CALLER", "CALLEE", "HOST", "MEMBER"]).optional(),
});

// call.incoming event schema
export const callIncomingSchema = z.object({
  callId: z.string(),
  type: z.enum(["AUDIO", "VIDEO"]),
  participants: z.array(socketParticipantSchema).min(1), // Required, at least 1 participant
  timestamp: z.number(),
});


// call.participant-accepted event schema
export const callParticipantAcceptedSchema = z.object({
  callId: z.string(),
  participantId: z.string(),
  participant: socketParticipantSchema,
  acceptedAt: z.string().optional(),
});

// call.join-info event schema
export const callJoinInfoSchema = z.object({
  callId: z.string(),
  token: z.string(),
  url: z.string().optional(),
  roomName: z.string(),
  expiresAt: z.number().optional(),
});

// call.ended event schema
export const callEndedSchema = z.object({
  callId: z.string(),
  reason: z.string().optional(),
  endedAt: z.string().optional(),
}).passthrough(); // Allow additional fields to pass through



// call.timeout event schema
export const callTimeoutSchema = z.object({
  callId: z.string(),
  reason: z.string().optional(),
  timestamp: z.number().optional(),
});

// call.participant-declined event schema
export const callParticipantDeclinedSchema = z.object({
  callId: z.string(),
  participantId: z.string(),
  participant: socketParticipantSchema,
  declinedAt: z.string().optional(),
});

// call.canceled event schema
export const callCanceledSchema = z.object({
  callId: z.string(),
  reason: z.string().optional(),
  timestamp: z.number().optional(),
  by: socketParticipantSchema.optional(),
});


// Inferred types for use in handlers
export type CallIncomingEvent = z.infer<typeof callIncomingSchema>;
export type CallParticipantAcceptedEvent = z.infer<typeof callParticipantAcceptedSchema>;
export type CallJoinInfoEvent = z.infer<typeof callJoinInfoSchema>;
export type CallEndedEvent = z.infer<typeof callEndedSchema>;
export type CallTimeoutEvent = z.infer<typeof callTimeoutSchema>;
export type CallParticipantDeclinedEvent = z.infer<typeof callParticipantDeclinedSchema>;
export type CallCanceledEvent = z.infer<typeof callCanceledSchema>;
