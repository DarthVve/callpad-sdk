import { useCallback, useEffect, useMemo, useState } from "react";
import { useSdk } from "../provider/RtcProvider";
import type { PresenceStatus, UserPresence } from "../state/presence.types";

export function usePresence(userId: string): {
  presence: UserPresence | undefined;
  status: PresenceStatus | undefined;
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const sdk = useSdk();
  const [presence, setPresence] = useState<UserPresence | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const result = await sdk.presence.getPresence(userId);
      setPresence(result);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

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
  const [presences, setPresences] = useState<Map<string, UserPresence>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const userIdsKey = useMemo(() => [...userIds].sort().join(","), [userIds]);

  const refetch = useCallback(async () => {
    if (userIds.length === 0) return;
    setIsLoading(true);
    try {
      const results = await sdk.presence.queryPresence(userIds);
      const map = new Map<string, UserPresence>();
      for (const p of results) {
        map.set(p.userId, p);
      }
      setPresences(map);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, userIdsKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    presences,
    isLoading,
    refetch,
  };
}
