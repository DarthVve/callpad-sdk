import { useParticipants } from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { useMemo, useState } from "react";
import { useRaiseHandStore } from "../channel/raiseHand/store";
import { useParticipantListStore } from "../state/participantListStore";
import type {
  ParticipantListOptions,
  ParticipantListReturn,
} from "../state/types";

function createSortFunction(
  sortBy: "speaking" | "name" | "raised-hand",
  getRaisedHandOrder?: (id: string) => number | null
) {
  return (a: Participant, b: Participant) => {
    if (sortBy === "raised-hand" && getRaisedHandOrder) {
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
  options: ParticipantListOptions = {}
): ParticipantListReturn {
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
    (state) => state.getRaisedHandOrder
  );

  const filteredParticipants = useMemo(() => {
    return includeLocalParticipant
      ? allParticipants
      : allParticipants.filter((p) => !p.isLocal);
  }, [allParticipants, includeLocalParticipant]);

  const sortedParticipants = useMemo(() => {
    const pinned: Participant[] = [];
    const unpinned: Participant[] = [];

    for (const participant of filteredParticipants) {
      if (isPinned(participant.identity)) {
        pinned.push(participant);
      } else {
        unpinned.push(participant);
      }
    }

    const sortFunction = createSortFunction(sortBy, getRaisedHandOrder);

    pinned.sort(sortFunction);
    unpinned.sort(sortFunction);

    return [...pinned, ...unpinned];
  }, [filteredParticipants, isPinned, sortBy, getRaisedHandOrder]);

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
