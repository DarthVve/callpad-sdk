import { useRtcStore } from "../state/store";
import type { Participant } from "../state/types";

interface UseParticipantsOptions {
  page?: number;
  pageSize?: number;
}

export function useParticipants(options?: UseParticipantsOptions) {
  const { page = 1, pageSize = 8 } = options || {};
  
  return useRtcStore((state) => {
    try {
      const allParticipants = Object.values(state.room.participants) || [];
      const caller = allParticipants.find((p) => p.role === "CALLER") || null;

      const totalParticipants = allParticipants.length;
      const totalPages = Math.ceil(totalParticipants / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const participants = allParticipants.slice(startIndex, endIndex);
      return {
        participants,
        caller,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        totalParticipants,
      };
    } catch (error) {
      return {
        participants: [],
        caller: null,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        totalParticipants: 0,
      };
    }
  });
}
