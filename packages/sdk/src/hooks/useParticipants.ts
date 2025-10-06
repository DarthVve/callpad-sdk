import {
  useParticipantView,
  useParticipantsForRinging,
  useParticipantsInCall,
} from "../state/selectors";
import { useRtcStore } from "../state/store";
import type { ParticipantView } from "../state/types";

// Re-export new hooks from selectors
export { useParticipantView, useParticipantsForRinging, useParticipantsInCall };

// Replacement for old useParticipants hook using new participant view system
export function useParticipants(): ParticipantView[] {
  return useAllParticipantViews();
}

// Replacement for old useParticipant hook
export function useParticipant(
  participantId: string
): ParticipantView | undefined {
  return useParticipantView(participantId);
}

// New convenience hooks using the participant view system
export function useAllParticipantViews(): ParticipantView[] {
  return useRtcStore((state) => {
    const views: ParticipantView[] = [];
    const allIds = new Set([
      ...Object.keys(state.profiles),
      ...Object.keys(state.presence),
      ...Object.keys(state.media),
    ]);

    for (const id of allIds) {
      const profile = state.profiles[id];
      const presence = state.presence[id];
      const media = state.media[id];

      views.push({
        id,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        avatarUrl: profile?.avatarUrl,
        role: presence?.role,
        invite: presence?.invite || "INVITED",
        join: presence?.join || "NOT_JOINED",
        isSpeaking: media?.isSpeaking || false,
        connectionQuality: media?.connectionQuality,
      });
    }

    return views;
  });
}
