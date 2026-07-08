import type { ParticipantMetadata } from "../../state/types";

export interface RaiseHandEnvelope {
  v: 1;
  kind: "raise-hand";
  roomId: string;
  ts: number;
  sender: {
    id: string;
    info?: ParticipantMetadata;
  };
  payload: {
    action: "raise" | "lower" | "lower-all";
    targetId?: string;
  };
}

export interface RaisedHand {
  ts: number;
  order: number;
}

export interface RaiseHandState {
  raisedHands: Map<string, RaisedHand>;
  nextOrder: number;
}
