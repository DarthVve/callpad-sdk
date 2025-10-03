import { useCallback } from "react";
import { clearErrors } from "../state/errors";
import type { ErrorCode, RtcError } from "../state/errors";
import { useRtcStore } from "../state/store";

export interface UseErrorsReturn {
  errors: RtcError[];
  clearAll: () => void;
  clearByCode: (code: ErrorCode) => void;
  clearByPredicate: (predicate: (error: RtcError) => boolean) => void;
  hasErrors: boolean;
  errorCount: number;
  latestError: RtcError | undefined;
}

/**
 * Hook for apps to consume and manage SDK errors
 *
 * Provides read access to all errors and methods to clear them.
 * Perfect for implementing toast notifications, error logging, and telemetry.
 *
 * @example
 * const { errors, clearAll, hasErrors } = useErrors();
 *
 * // Show toast for new errors
 * useEffect(() => {
 *   if (hasErrors) {
 *     showToast(errors[errors.length - 1].message);
 *   }
 * }, [errors, hasErrors]);
 */
export function useErrors(): UseErrorsReturn {
  // Subscribe to errors array in store
  const errors = useRtcStore((state) => state.errors);

  // Clear all errors
  const clearAll = useCallback(() => {
    clearErrors();
  }, []);

  // Clear errors by code
  const clearByCode = useCallback((code: ErrorCode) => {
    clearErrors((error) => error.code === code);
  }, []);

  // Clear errors by custom predicate
  const clearByPredicate = useCallback(
    (predicate: (error: RtcError) => boolean) => {
      clearErrors(predicate);
    },
    []
  );

  return {
    errors,
    clearAll,
    clearByCode,
    clearByPredicate,
    hasErrors: errors.length > 0,
    errorCount: errors.length,
    latestError: errors[errors.length - 1] || undefined,
  };
}

/**
 * Hook to get errors of specific types
 * Useful for filtering errors by category
 *
 * @example
 * const deviceErrors = useErrorsByCode(['DEVICE_SWITCH', 'MEDIA_PERMISSION']);
 */
export function useErrorsByCode(codes: ErrorCode[]): RtcError[] {
  return useRtcStore((state) =>
    state.errors.filter((error) => codes.includes(error.code as ErrorCode))
  );
}

/**
 * Hook to get the count of errors by code
 * Useful for badges and indicators
 */
export function useErrorCount(): number {
  return useRtcStore((state) => state.errors.length);
}
