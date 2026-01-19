import { useParticipants } from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { useEffect, useMemo, useState } from "react";
import { useRaiseHandStore } from "../channel/raiseHand/store";
import { useParticipantListStore } from "../state/participantListStore";
import type {
  ParticipantListOptions,
  ParticipantListReturn,
} from "../state/types";

function createSortFunction(
  sortBy: "speaking" | "name" | "raised-hand",
  getRaisedHandOrder?: (id: string) => number | null,
  isPinned?: (id: string) => boolean,
) {
  return (a: Participant, b: Participant) => {
    if (isPinned) {
      const aPinned = isPinned(a.identity);
      const bPinned = isPinned(b.identity);

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
    }

    if (getRaisedHandOrder) {
      const aOrder = getRaisedHandOrder(a.identity);
      const bOrder = getRaisedHandOrder(b.identity);

      if (aOrder !== null && bOrder === null) {
        return -1;
      }
      if (aOrder === null && bOrder !== null) {
        return 1;
      }
      if (aOrder !== null && bOrder !== null) {
        return aOrder - bOrder;
      }
    }

    if (sortBy === "speaking") {
      const aIsSpeaking = a.isSpeaking || false;
      const bIsSpeaking = b.isSpeaking || false;

      // sorting by isSpeaking
      if (aIsSpeaking && !bIsSpeaking) {
        return -1;
      }
      if (!aIsSpeaking && bIsSpeaking) {
        return 1;
      }
    }

    const aName = a.name || a.identity;
    const bName = b.name || b.identity;
    return aName.localeCompare(bName);
  };
}

export function useParticipantList(
  options: ParticipantListOptions = {},
): ParticipantListReturn & { sortedParticipants: Participant[] } {
  const {
    pageSize = 9,
    includeLocalParticipant = true,
    sortBy = "speaking",
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(pageSize);

  const allParticipants = useParticipants();
  const { togglePin, clearPinned, isPinned } = useParticipantListStore();
  const getRaisedHandOrder = useRaiseHandStore(
    (state) => state.getRaisedHandOrder,
  );
  const raisedHands = useRaiseHandStore((state) => state.raisedHands);

  const filteredParticipants = useMemo(() => {
    return includeLocalParticipant
      ? allParticipants
      : allParticipants.filter((p) => !p.isLocal);
  }, [allParticipants, includeLocalParticipant]);

  const sortedParticipants = useMemo(() => {
    const sortFn = createSortFunction(sortBy, getRaisedHandOrder, isPinned);
    return [...filteredParticipants].sort(sortFn);
  }, [filteredParticipants, isPinned, sortBy, getRaisedHandOrder, raisedHands]);

  const pinnedParticipants = useMemo(() => {
    return sortedParticipants.filter((p) => isPinned(p.identity));
  }, [sortedParticipants, isPinned]);

  const totalParticipants = sortedParticipants.length;
  const totalPages = Math.ceil(totalParticipants / pageSizeState);

  const startIndex = (currentPage - 1) * pageSizeState;
  const endIndex = startIndex + pageSizeState;
  const participants = sortedParticipants.slice(startIndex, endIndex);

  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const nextPage = () => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  };

  return {
    participants,
    sortedParticipants, // Exposed for grid views
    pinnedParticipants,
    currentPage,
    totalPages,
    pageSize: pageSizeState,
    totalParticipants,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    setPageSize,
    togglePin,
    clearPinned,
    isPinned,
  };
}
