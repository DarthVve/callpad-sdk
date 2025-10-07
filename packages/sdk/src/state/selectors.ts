import { useRtcStore } from "./store";
import type { Participant } from "./types";

export function useParticipants(): Participant[] {
  return useRtcStore((state) => Object.values(state.room.participants));
}

export function useParticipant(id: string): Participant | undefined {
  return useRtcStore((state) => state.room.participants[id]);
}

export function useRingingParticipants(): Participant[] {
  return useRtcStore((state) =>
    Object.values(state.room.participants).filter(
      (p) => state.session.status === "RINGING"
    )
  );
}

export function useLocalParticipant(): Participant | undefined {
  return useRtcStore((state) => {
    // Find the local participant by checking if they match the LiveKit local participant identity
    const allParticipants = Object.values(state.room.participants);
    // For now, return the first participant as a temporary solution
    // TODO: Properly track local participant identity
    return allParticipants[0];
  });
}

export function useSpeakingParticipants(): Participant[] {
  return useRtcStore((state) =>
    Object.values(state.room.participants).filter((p) => p.isSpeaking)
  );
}
