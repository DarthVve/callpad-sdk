import { useRtcStore } from "./store";
import type { MediaSummary, ParticipantView, Presence, Profile } from "./types";

function mergeParticipant(
  id: string,
  profile?: Profile,
  presence?: Presence,
  media?: MediaSummary
): ParticipantView {
  return {
    id,
    firstName: profile?.firstName || undefined,
    lastName: profile?.lastName || undefined,
    avatarUrl: profile?.avatarUrl || undefined,
    role: presence?.role || undefined,
    invite: presence?.invite || "INVITED",
    join: presence?.join || "NOT_JOINED",
    isSpeaking: media?.isSpeaking || false,
    connectionQuality: media?.connectionQuality || undefined,
  };
}

export function selectParticipantView(id: string): ParticipantView {
  const state = useRtcStore.getState();
  return mergeParticipant(
    id,
    state.profiles[id],
    state.presence[id],
    state.media[id]
  );
}

export function selectParticipantsForRinging(): ParticipantView[] {
  const state = useRtcStore.getState();
  const participants: ParticipantView[] = [];

  // Get all participants from presence (they should be there if invited)
  for (const [id, presence] of Object.entries(state.presence)) {
    if (presence.join === "NOT_JOINED" || presence.join === "JOINING") {
      participants.push(
        mergeParticipant(id, state.profiles[id], presence, state.media[id])
      );
    }
  }

  return participants;
}

export function selectParticipantsInCall(): ParticipantView[] {
  const state = useRtcStore.getState();
  const participants: ParticipantView[] = [];

  // Get all participants that are joining or joined
  for (const [id, presence] of Object.entries(state.presence)) {
    if (presence.join === "JOINING" || presence.join === "JOINED") {
      participants.push(
        mergeParticipant(id, state.profiles[id], presence, state.media[id])
      );
    }
  }

  return participants;
}

export function selectSpeakingParticipants(): string[] {
  const state = useRtcStore.getState();
  return Object.entries(state.media)
    .filter(([_, media]) => media.isSpeaking)
    .map(([id]) => id);
}

export function selectSelf(): ParticipantView | null {
  const state = useRtcStore.getState();

  // Find the local participant - for now we'll use a simple approach
  // This will be improved when we have proper self-identification
  for (const [id, presence] of Object.entries(state.presence)) {
    if (presence.role === "CALLER" || presence.role === "HOST") {
      return mergeParticipant(
        id,
        state.profiles[id],
        presence,
        state.media[id]
      );
    }
  }

  return null;
}

// Hook versions for React components
export function useParticipantView(id: string) {
  return useRtcStore((state) =>
    mergeParticipant(
      id,
      state.profiles[id],
      state.presence[id],
      state.media[id]
    )
  );
}

export function useParticipantsForRinging() {
  return useRtcStore((state) => {
    const participants: ParticipantView[] = [];
    for (const [id, presence] of Object.entries(state.presence)) {
      if (presence.join === "NOT_JOINED" || presence.join === "JOINING") {
        participants.push(
          mergeParticipant(id, state.profiles[id], presence, state.media[id])
        );
      }
    }
    return participants;
  });
}

export function useParticipantsInCall() {
  return useRtcStore((state) => {
    const participants: ParticipantView[] = [];
    for (const [id, presence] of Object.entries(state.presence)) {
      if (presence.join === "JOINING" || presence.join === "JOINED") {
        participants.push(
          mergeParticipant(id, state.profiles[id], presence, state.media[id])
        );
      }
    }
    return participants;
  });
}
