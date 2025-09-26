import { useRtcStore } from "../state/store";
import type { ParticipantState } from "../state/types";

export function useParticipants(): ParticipantState[] {
  const participants = useRtcStore((state) => state.participants);

  // Convert Record to array and sort by name
  return Object.values(participants).sort(
    (a: ParticipantState, b: ParticipantState) => {
      // Local participant first
      if (a.isLocal && !b.isLocal) return -1;
      if (!a.isLocal && b.isLocal) return 1;

      // Then by name
      return (a.name || a.id).localeCompare(b.name || b.id);
    }
  );
}

export function useParticipant(
  participantId: string
): ParticipantState | undefined {
  return useRtcStore((state) => state.participants[participantId]);
}
