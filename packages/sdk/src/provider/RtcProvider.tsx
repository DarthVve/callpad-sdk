import React, { createContext, useContext, useEffect, useMemo } from "react";
import type { Nullable } from "../core";
import type { AuthManager } from "../core/auth.manager";
import {
  type AuthenticatedSdkOptions,
  type GuestRtcSdk,
  type GuestSdkOptions,
  type RtcSdk,
  type SdkBuildOptions,
  buildGuestSdk,
  buildSdk,
} from "../services";
import { rtcStore } from "../state/store";

export type RtcOptions = SdkBuildOptions;
export type { RtcSdk, GuestRtcSdk };

type AnySdk = RtcSdk | GuestRtcSdk;

const RtcContext = createContext<Nullable<AnySdk>>(null);

function isGuestOptions(options: SdkBuildOptions): options is GuestSdkOptions {
  return options.mode === "guest";
}

export function RtcProvider({
  options,
  children,
}: {
  options: RtcOptions;
  children: React.ReactNode;
}) {
  const isGuestMode = isGuestOptions(options);

  const sdk = useMemo(() => {
    if (isGuestMode) {
      return buildGuestSdk(options);
    }
    return buildSdk(options as AuthenticatedSdkOptions);
  }, [options, isGuestMode]);

  useEffect(() => {
    if (!isGuestMode) {
      const authSdk = sdk as RtcSdk;
      authSdk.socket
        .initialize(
          options.signalHost,
          authSdk.auth as AuthManager,
          {
            reconnectAttempts: 5,
            reconnectDelay: 1000,
          },
          undefined
        )
        .catch((error: any) => {
          options.log?.(
            "error",
            "Failed to initialize socket connection",
            error
          );

          rtcStore.getState().addError({
            code: "SOCKET_INIT_ERROR",
            message: "Failed to initialize socket connection",
            timestamp: Date.now(),
            context: error,
          });
        });
    }

    return () => {
      sdk.cleanup();
    };
  }, [sdk, options, isGuestMode]);

  return React.createElement(RtcContext.Provider, { value: sdk }, children);
}

export function useSdk(): RtcSdk {
  const ctx = useContext(RtcContext);
  if (!ctx) {
    throw new Error("useSdk must be used within RtcProvider");
  }
  return ctx as RtcSdk;
}

export function useGuestSdk(): GuestRtcSdk {
  const ctx = useContext(RtcContext);
  if (!ctx) {
    throw new Error("useGuestSdk must be used within RtcProvider");
  }
  return ctx as GuestRtcSdk;
}
