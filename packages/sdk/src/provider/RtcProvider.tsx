import React, { createContext, useContext, useEffect, useMemo } from "react";
import type { Nullable } from "../core";
import { type RtcSdk, type SdkBuildOptions, buildSdk } from "../services";
import { rtcStore } from "../state/store";

export type RtcOptions = SdkBuildOptions;
export type { RtcSdk };

const RtcContext = createContext<Nullable<RtcSdk>>(null);

export function RtcProvider({
  options,
  children,
}: {
  options: RtcOptions;
  children: React.ReactNode;
}) {
  const sdk = useMemo(() => buildSdk(options), [options]);

  useEffect(() => {
    // API is already configured in buildSdk, so we can directly initialize the socket
    // Initialize socket connection with livekit service
    sdk.socket
      .initialize(
        options.signalHost,
        sdk.auth,
        {
          reconnectAttempts: 5,
          reconnectDelay: 1000,
        },
        undefined
      )
      .catch((error: any) => {
        options.log?.("error", "Failed to initialize socket connection", error);

        rtcStore.getState().addError({
          code: "SOCKET_INIT_ERROR",
          message: "Failed to initialize socket connection",
          timestamp: Date.now(),
          context: error,
        });
      });

    return () => {
      sdk.cleanup();
    };
  }, [sdk, options]);

  return React.createElement(RtcContext.Provider, { value: sdk }, children);
}

export const useSdk = (): RtcSdk => {
  const ctx = useContext(RtcContext);
  if (!ctx) {
    throw new Error("useSdk must be used within RtcProvider");
  }
  return ctx;
};
