import type { ParticipantMetadata } from "../../state/types";

export interface SpotlightEnvelope {
  v: 1;
  kind: "spotlight";
  roomId: string;
  ts: number;
  sender: {
    id: string;
    info?: ParticipantMetadata;
  };
  payload: {
    action: "spotlight" | "unspotlight";
    targetId: string;
    info?: ParticipantMetadata;
  };
}

export interface SpotlightedUser {
  participantId: string;
  ts: number;
  info?: ParticipantMetadata;
}

export interface SpotlightState {
  spotlightedUser: SpotlightedUser | null;
  isSpotlighted: boolean;
}

