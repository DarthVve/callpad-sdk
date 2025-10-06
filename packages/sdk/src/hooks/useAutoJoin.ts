import { useSdk } from "../provider/RtcProvider";
import type { AutoJoinConfig } from "../core/types";

export interface UseAutoJoinReturn {
  /**
   * Current auto-join configuration
   */
  config: AutoJoinConfig;
  
  /**
   * Whether auto-join is enabled
   */
  isEnabled: boolean;
  
  /**
   * Whether retry on failure is enabled
   */
  retryOnFailure: boolean;
  
  /**
   * Get maximum retry attempts
   */
  maxRetries: number;
}

/**
 * Hook to access auto-join configuration and utilities
 */
export function useAutoJoin(): UseAutoJoinReturn {
  const sdk = useSdk();
  const config = sdk.autoJoinConfig;

  return {
    config,
    isEnabled: config.enabled,
    retryOnFailure: config.retryOnFailure,
    maxRetries: config.maxRetries,
  };
}

/**
 * Hook to determine if the current user should auto-join based on their role
 */
export function useAutoJoinForCurrentUser() {
  const sdk = useSdk();
  const autoJoin = useAutoJoin();
  
  // Get current user info from auth
  const currentUserId = sdk.auth.getCurrentUserId();
  
  if (!currentUserId) {
    return {
      shouldAutoJoin: false,
      reason: "No current user",
    };
  }
  
  return {
    shouldAutoJoin: autoJoin.isEnabled,
    reason: autoJoin.isEnabled 
      ? "Auto-join enabled"
      : "Auto-join disabled",
  };
}

export type UseAutoJoinForCurrentUserReturn = ReturnType<typeof useAutoJoinForCurrentUser>;