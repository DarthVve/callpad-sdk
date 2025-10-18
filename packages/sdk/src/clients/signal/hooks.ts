import React, { createContext, useContext, useMemo } from "react";
import { SignalClient } from "./client";
import type { SignalClientConfig } from "./types";

const SignalServiceContext = createContext<SignalClient | null>(null);

export interface SignalServiceProviderProps {
  config: SignalClientConfig;
  children: React.ReactNode;
}

export function SignalServiceProvider({ config, children }: SignalServiceProviderProps) {
  const client = useMemo(() => new SignalClient(config), [config]);

  return React.createElement(
    SignalServiceContext.Provider,
    { value: client },
    children
  );
}

export function useSignalService(): SignalClient {
  const client = useContext(SignalServiceContext);
  if (!client) {
    throw new Error("useSignalService must be used within a SignalServiceProvider");
  }
  return client;
}

// Hook for creating a signal client without provider (for standalone usage)
export function useSignalClient(config: SignalClientConfig): SignalClient {
  return useMemo(() => new SignalClient(config), [config]);
}