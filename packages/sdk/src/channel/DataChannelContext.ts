import { createContext, useContext } from "react";

export interface DataChannelContextValue {
  services: Map<string, any>;
  isReady: boolean;
}

export const DataChannelContext = createContext<DataChannelContextValue | null>(null);

export function useDataChannelContext(): DataChannelContextValue {
  const context = useContext(DataChannelContext);
  if (!context) {
    throw new Error("useDataChannelContext must be used within DataChannelProvider");
  }
  return context;
}

export function useFeatureService<T = any>(featureName: string): T {
  const { services } = useDataChannelContext();
  const service = services.get(featureName) as T;
  if (!service) {
    throw new Error(
      `Feature service "${featureName}" not found. Make sure it's enabled in DataChannelProvider.`
    );
  }
  
  return service;
}
