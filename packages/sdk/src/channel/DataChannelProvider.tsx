import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Room } from "livekit-client";
import { DataChannelContext, type DataChannelContextValue } from "./DataChannelContext";
import { FEATURES, DEFAULT_FEATURES } from "./registry";
import { createLogger } from "../utils";

const logger = createLogger("channels:provider");

export interface DataChannelProviderProps {
  room: Room;
  features?: string[];
  children: ReactNode;
}

export function DataChannelProvider({
  room,
  features = DEFAULT_FEATURES,
  children,
}: DataChannelProviderProps) {
  const services = useRef<Map<string, any>>(new Map());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!room) {
      logger.warn("DataChannelProvider mounted without room");
      return;
    }

    logger.debug("Initializing features", { features });
    for (const featureName of features) {
      const feature = FEATURES[featureName];
      
      if (!feature) {
        logger.warn(`Feature "${featureName}" not found in registry`);
        continue;
      }

      try {
        logger.debug(`Initializing feature: ${featureName}`);
        const service = feature.createService(room);

        service.subscribe();
        services.current.set(featureName, service);
        
        logger.info(`Feature "${featureName}" initialized`);
      } catch (error) {
        logger.error(`Failed to initialize feature "${featureName}"`, error);
      }
    }

    setIsReady(true);
    logger.info("All features initialized");
    return () => {
      logger.debug("Cleaning up features");

      // Unsubscribe all services
      services.current.forEach((service, name) => {
        try {
          logger.debug(`Unsubscribing feature: ${name}`);
          service.unsubscribe();
        } catch (error) {
          logger.error(`Failed to unsubscribe feature "${name}"`, error);
        }
      });

      // Clean up stores
      for (const featureName of features) {
        const feature = FEATURES[featureName];
        if (feature?.cleanupStore) {
          try {
            logger.debug(`Cleaning store for feature: ${featureName}`);
            feature.cleanupStore();
          } catch (error) {
            logger.error(`Failed to cleanup store for "${featureName}"`, error);
          }
        }
      }

      services.current.clear();
      setIsReady(false);
      logger.info("Features cleanup complete");
    };
  }, [room, features]);

  const contextValue = useMemo<DataChannelContextValue>(
    () => ({
      services: services.current,
      isReady,
    }),
    [isReady]
  );

  return (
    <DataChannelContext.Provider value={contextValue}>
      {children}
    </DataChannelContext.Provider>
  );
}
