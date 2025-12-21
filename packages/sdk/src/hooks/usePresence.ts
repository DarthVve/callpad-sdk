import { useCallback, useEffect, useMemo, useState } from "react";
import { useSdk } from "../provider/RtcProvider";
import { usePresenceStore } from "../state/presence.store";
import type { PresenceStatus, UserPresence } from "../state/presence.types";

export function usePresence(userId: string): {
  presence: UserPresence | undefined;
  status: PresenceStatus | undefined;
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const sdk = useSdk();
  const [isLoading, setIsLoading] = useState(false);
  const presence = usePresenceStore((state) => state.presence.get(userId));

  const refetch = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      await sdk.presence.getPresence(userId);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, userId]);

  useEffect(() => {
    if (userId && !presence) {
      refetch();
    }
  }, [userId, presence, refetch]);

  return {
    presence,
    status: presence?.status,
    isLoading,
    refetch,
  };
}

export function usePresenceMany(userIds: string[]): {
  presences: Map<string, UserPresence>;
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const sdk = useSdk();
  const [isLoading, setIsLoading] = useState(false);
  const userIdsKey = useMemo(() => [...userIds].sort().join(","), [userIds]);

  const presences = usePresenceStore((state) => {
    const map = new Map<string, UserPresence>();
    for (const id of userIds) {
      const p = state.presence.get(id);
      if (p) map.set(id, p);
    }
    return map;
  });

  const refetch = useCallback(async () => {
    if (userIds.length === 0) return;
    setIsLoading(true);
    try {
      await sdk.presence.queryPresence(userIds);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, userIdsKey]);

  useEffect(() => {
    const missingIds = userIds.filter(
      (id) => !presences.has(id)
    );
    if (missingIds.length > 0) {
      refetch();
    }
  }, [userIdsKey, presences, refetch]);

  return {
    presences,
    isLoading,
    refetch,
  };
}
