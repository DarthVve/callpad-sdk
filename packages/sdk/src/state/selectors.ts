import type { RtcState } from "./types";

export const selectSession = (state: RtcState) => state.session;
export const selectIncomingInvite = (state: RtcState) => state.incomingInvite;
export const selectOutgoingInvites = (state: RtcState) => state.outgoingInvites;
