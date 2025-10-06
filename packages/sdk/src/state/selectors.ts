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
      (p) => p.callState === "RINGING"
    )
  );
}

export function useLocalParticipant(): Participant | undefined {
  return undefined;
}

export function useSpeakingParticipants(): Participant[] {
  return useRtcStore((state) =>
    Object.values(state.room.participants).filter((p) => p.isSpeaking)
  );
}
