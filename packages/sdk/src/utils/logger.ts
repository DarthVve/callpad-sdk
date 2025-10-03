/**
 * Logger utility for the RTC SDK
 *
 * Provides a consistent logging interface across all SDK components
 * with a safe console fallback when no logger is provided by the app.
 */

export type Logger = (
  level: "debug" | "info" | "warn" | "error",
  msg: string,
  extra?: any
) => void;

/**
 * Default console logger implementation
 * Safe fallback that handles all log levels appropriately
 */
export const consoleLogger: Logger = (level, msg, extra) => {
  if (typeof console !== "undefined" && console[level]) {
    if (extra !== undefined) {
      console[level](`[RTC SDK] ${msg}`, extra);
    } else {
      console[level](`[RTC SDK] ${msg}`);
    }
  }
};

/**
 * Create a prefixed logger for specific components
 */
export function createComponentLogger(
  baseLogger: Logger,
  componentName: string
): Logger {
  return (level, msg, extra) => {
    baseLogger(level, `[${componentName}] ${msg}`, extra);
  };
}

/**
 * No-op logger for when logging should be disabled
 */
export const noopLogger: Logger = () => {
  // Do nothing
};
