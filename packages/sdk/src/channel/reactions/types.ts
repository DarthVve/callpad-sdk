import type { ParticipantMetadata } from "../../state/types";

export interface ReactionEnvelope {
  v: 1;
  kind: "reaction";
  roomId: string;
  ts: number;
  sender: {
    id: string;
    info?: ParticipantMetadata;
  };
  payload: {
    emoji: string;
    nonce: string;
  };
}

export interface ParticipantReaction {
  emoji: string;
  ts: number;
  nonce: string;
}

export interface ReactionsState {
  reactions: Map<string, ParticipantReaction>;
  participantCache: Record<string, ParticipantMetadata>;
  ttlMs: number;
}
