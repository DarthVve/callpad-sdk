/**
 * Comprehensive logging system for the Callpad Web SDK
 *
 * Features:
 * - Log level filtering (debug, info, warn, error)
 * - Environment variable configuration (DEBUG, CALLPAD_LOG_LEVEL)
 * - Hierarchical namespacing (callpad:socket:connection)
 * - Custom logger integration
 * - Zero-cost when disabled
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerOptions {
  level?: LogLevel;
  enableDebug?: boolean;
  customLogger?: (level: LogLevel, message: string, meta?: any) => void;
}

export interface CallpadLogger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  child(namespace: string): CallpadLogger;
  setLevel(level: LogLevel): void;
  isLevelEnabled(level: LogLevel): boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class CallpadLoggerImpl implements CallpadLogger {
  private namespace: string;
  private level: LogLevel;
  private enableDebug: boolean;
  private customLogger?: (level: LogLevel, message: string, meta?: any) => void;

  constructor(namespace = "callpad", options: LoggerOptions = {}) {
    this.namespace = namespace;
    this.level = options.level ?? this.getDefaultLevel();
    this.enableDebug = options.enableDebug ?? this.shouldEnableDebug();
    if (options.customLogger) {
      this.customLogger = options.customLogger;
    }
  }

  private getDefaultLevel(): LogLevel {
    const envLevel =
      typeof window !== "undefined"
        ? (window as any).__CALLPAD_LOG_LEVEL__
        : typeof globalThis !== "undefined" &&
          (globalThis as any).process?.env?.CALLPAD_LOG_LEVEL;

    if (envLevel && this.isValidLogLevel(envLevel)) {
      return envLevel as LogLevel;
    }

    const isProduction =
      typeof globalThis !== "undefined" &&
      (globalThis as any).process?.env?.NODE_ENV === "production";

    return isProduction ? "warn" : "info";
  }

  private shouldEnableDebug(): boolean {
    const debugEnv =
      typeof window !== "undefined"
        ? (window as any).__DEBUG__
        : typeof globalThis !== "undefined" &&
          (globalThis as any).process?.env?.DEBUG;

    if (!debugEnv) return false;

    const debugPatterns = debugEnv.split(/[\s,]+/);
    return debugPatterns.some((pattern: string) => {
      if (pattern === "*") return true;
      if (pattern.endsWith("*")) {
        const prefix = pattern.slice(0, -1);
        return this.namespace.startsWith(prefix);
      }
      return this.namespace === pattern;
    });
  }

  private isValidLogLevel(level: string): boolean {
    return Object.keys(LOG_LEVELS).includes(level);
  }

  private shouldLog(level: LogLevel): boolean {
    if (level === "debug" && !this.enableDebug) {
      return false;
    }
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.namespace}] [${level.toUpperCase()}]`;

    if (this.customLogger) {
      this.customLogger(level, message, meta);
      return;
    }

    const logMethod =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : level === "info"
            ? console.info
            : console.log;

    if (meta !== undefined) {
      logMethod(`${prefix} ${message}`, meta);
    } else {
      logMethod(`${prefix} ${message}`);
    }
  }

  debug(message: string, meta?: any): void {
    this.formatMessage("debug", message, meta);
  }

  info(message: string, meta?: any): void {
    this.formatMessage("info", message, meta);
  }

  warn(message: string, meta?: any): void {
    this.formatMessage("warn", message, meta);
  }

  error(message: string, meta?: any): void {
    this.formatMessage("error", message, meta);
  }

  child(namespace: string): CallpadLogger {
    const childNamespace = `${this.namespace}:${namespace}`;
    const childOptions: LoggerOptions = {
      level: this.level,
      enableDebug: this.enableDebug,
    };
    if (this.customLogger) {
      childOptions.customLogger = this.customLogger;
    }
    return new CallpadLoggerImpl(childNamespace, childOptions);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  isLevelEnabled(level: LogLevel): boolean {
    return this.shouldLog(level);
  }
}

let rootLogger: CallpadLogger | null = null;

export function createLogger(
  namespace?: string,
  options?: LoggerOptions
): CallpadLogger {
  if (!namespace) {
    if (!rootLogger) {
      rootLogger = new CallpadLoggerImpl("callpad", options);
    }
    return rootLogger;
  }

  return new CallpadLoggerImpl(`callpad:${namespace}`, options);
}

export function setGlobalLoggerOptions(options: LoggerOptions): void {
  rootLogger = new CallpadLoggerImpl("callpad", options);
}
