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
    // Configure API first
    try {
      sdk.configureApi({
        baseUrl: options.signalHost,
        token: async () => {
          const token = sdk.auth.getCurrentToken();
          return token || "";
        },
      });
      options.log?.("info", "API configured successfully");
    } catch (error) {
      options.log?.("error", "Failed to configure API", error);
      rtcStore.getState().addError({
        code: "API_CONFIG_ERROR",
        message: "Failed to configure API",
        timestamp: Date.now(),
        context: error,
      });
    }

    // Initialize socket connection with livekit service
    sdk.socket
      .initialize(
        options.signalHost,
        sdk.auth,
        {
          reconnectAttempts: 5,
          reconnectDelay: 1000,
        },
        sdk.livekit
      )
      .catch((error) => {
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
