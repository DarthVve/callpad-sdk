import { useRtcStore } from "../state/store";
import { useSdk } from "../provider/RtcProvider";
import type { Participant } from "../state/types";

type ParticipantKind = "active" | "missed" | "left";

interface UseParticipantsOptions {
  page?: number;
  pageSize?: number;
  kind?: ParticipantKind;
}

export function useParticipants(callId?: string, options?: UseParticipantsOptions) {
  const { page = 1, pageSize = 8, kind = "active" } = options || {};
  
  return useRtcStore((state) => {
    try {
      const allParticipants = Object.values(state.room.participants) || [];
      
      let filteredParticipants: Participant[] = [];
      switch (kind) {
        case "active":
          filteredParticipants = allParticipants.filter((p) => p.callState === "JOINED");
          break;
        case "missed":
          filteredParticipants = allParticipants.filter((p) => p.callState === "INVITED");
          break;
        case "left":
          filteredParticipants = allParticipants.filter((p) => p.callState === "LEFT");
          break;
        default:
          filteredParticipants = allParticipants.filter((p) => p.callState === "JOINED");
      }

      const activeParticipants = allParticipants.filter((p) => p.callState === "JOINED");
      const pendingParticipants = allParticipants.filter(
        (p) => p.callState === "INVITED" || p.callState === "RINGING"
      );
      const caller = allParticipants.find((p) => p.role === "CALLER") || null;

      let localParticipant: Participant | null = null;
      try {
        const sdk = useSdk();
        const currentUserId = sdk.auth.getCurrentUserId();
        localParticipant = currentUserId ? state.room.participants[currentUserId] || null : null;
      } catch {
        localParticipant = null;
      }

      const totalParticipants = filteredParticipants.length;
      const totalPages = Math.ceil(totalParticipants / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const participants = filteredParticipants.slice(startIndex, endIndex);

      return {
        participants,
        activeParticipants,
        pendingParticipants,
        caller,
        localParticipant,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        totalParticipants,
      };
    } catch (error) {
      return {
        participants: [],
        activeParticipants: [],
        pendingParticipants: [],
        caller: null,
        localParticipant: null,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        totalParticipants: 0,
      };
    }
  });
}

export function useParticipant(participantId: string): Participant | undefined {
  return useRtcStore((state) => state.room.participants[participantId]);
}


export function useRingingParticipants(): Participant[] {
  return useRtcStore((state) =>
    Object.values(state.room.participants).filter(
      (p) => p.callState === "RINGING"
    )
  );
}

export function useLocalParticipant(): Participant | undefined {
  const sdk = useSdk();
  
  return useRtcStore((state) => {
    const currentUserId = sdk.auth.getCurrentUserId();
    return currentUserId ? state.room.participants[currentUserId] : undefined;
  });
}

export function useSpeakingParticipants(): Participant[] {
  return useRtcStore((state) =>
    Object.values(state.room.participants).filter((p) => p.isSpeaking)
  );
}
