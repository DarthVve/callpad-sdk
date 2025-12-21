import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { BackgroundProcessor } from "@livekit/track-processors";
import { type LocalVideoTrack, RoomEvent, Track } from "livekit-client";
import { useEffect, useRef } from "react";

export interface UseVirtualBackgroundOptions {
  /**
   * Image URL for virtual background mode.
   * Required when mode is 'virtual-background'.
   * Must have CORS enabled.
   */
  imagePath?: string | null;
  /**
   * Background processing mode
   * @default 'virtual-background'
   */
  mode?: "virtual-background" | "blur";
  /**
   * Blur radius for blur mode (1-20)
   * Only used when mode is 'blur'
   */
  blurRadius?: number;
  /**
   * Whether the virtual background is enabled
   * @default true
   */
  enabled?: boolean;
}

export function useVirtualBackground(
  options: UseVirtualBackgroundOptions
): void {
  const {
    imagePath,
    mode = "virtual-background",
    blurRadius,
    enabled = true,
  } = options;

  const room = useRoomContext();
  const participant = useLocalParticipant();
  const localParticipant = participant?.localParticipant;
  const processorRef = useRef<ReturnType<typeof BackgroundProcessor> | null>(
    null
  );
  const isActiveRef = useRef(true);
  const pendingOperationRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    // Reset active flag when effect runs
    isActiveRef.current = true;

    if (!enabled || !localParticipant || !room) {
      isActiveRef.current = false;
      return;
    }

    if (mode === "virtual-background" && !imagePath) {
      isActiveRef.current = false;
      return;
    }

    const applyBackground = async () => {
      if (!isActiveRef.current) {
        return;
      }

      if (pendingOperationRef.current) {
        try {
          await pendingOperationRef.current;
        } catch (error) {
          console.error("Error in pending operation:", error);
        }
      }

      // Check again after waiting (effect might have been cleaned up)
      if (!isActiveRef.current) {
        return;
      }

      const operationPromise = (async () => {
        try {
          const cameraPublication = localParticipant.getTrackPublication(
            Track.Source.Camera
          );

          if (!cameraPublication?.track) {
            return;
          }

          // Check again after async gap
          if (!isActiveRef.current) {
            return;
          }

          const localVideoTrack = cameraPublication.track as LocalVideoTrack & {
            addProcessor: (
              processor: ReturnType<typeof BackgroundProcessor>
            ) => Promise<void>;
            removeProcessor: (
              processor: ReturnType<typeof BackgroundProcessor>
            ) => Promise<void>;
          };

          if (processorRef.current) {
            try {
              await localVideoTrack.removeProcessor(processorRef.current);
            } catch (error) {
              console.warn("Failed to remove background processor:", error);
            }
            processorRef.current = null;
          }

          // Final check before adding new processor
          if (!isActiveRef.current) {
            return;
          }

          // Create processor configuration
          const processorConfig: {
            mode: "virtual-background" | "blur";
            imagePath?: string;
            blurRadius?: number;
          } = {
            mode,
          };

          if (mode === "virtual-background" && imagePath) {
            processorConfig.imagePath = imagePath;
          } else if (mode === "blur" && blurRadius) {
            processorConfig.blurRadius = blurRadius;
          }

          // Create and apply new processor
          const processor = BackgroundProcessor(processorConfig);
          await localVideoTrack.addProcessor(processor);

          // Only set processor if effect is still active
          if (isActiveRef.current) {
            processorRef.current = processor;
          } else {
            // Effect was cleaned up, remove the processor we just added
            try {
              await localVideoTrack.removeProcessor(processor);
            } catch (error) {
              console.error("Failed to remove background processor:", error);
            }
          }
        } catch (error) {
          console.error("Failed to apply virtual background:", error);
        }
      })();

      pendingOperationRef.current = operationPromise;

      try {
        await operationPromise;
      } finally {
        if (pendingOperationRef.current === operationPromise) {
          pendingOperationRef.current = null;
        }
      }
    };

    // Apply background immediately if track exists
    applyBackground().catch((error) => {
      console.error("Error in applyBackground:", error);
    });

    // Listen for track published events (when camera is enabled)
    const handleTrackPublished = (publication: any) => {
      if (publication.source === Track.Source.Camera) {
        applyBackground().catch((error) => {
          console.error(
            "Error in applyBackground from track published:",
            error
          );
        });
      }
    };

    room.on(RoomEvent.LocalTrackPublished, handleTrackPublished);

    // Cleanup function
    return () => {
      isActiveRef.current = false;

      room.off(RoomEvent.LocalTrackPublished, handleTrackPublished);

      // Cleanup processor if it exists
      if (processorRef.current && localParticipant) {
        const cameraPublication = localParticipant.getTrackPublication(
          Track.Source.Camera
        );
        if (cameraPublication?.track) {
          const localVideoTrack = cameraPublication.track as LocalVideoTrack & {
            removeProcessor: (
              processor: ReturnType<typeof BackgroundProcessor>
            ) => Promise<void>;
          };
          localVideoTrack
            .removeProcessor(processorRef.current)
            .catch((error: unknown) => {
              console.warn(
                "Failed to remove background processor on cleanup:",
                error
              );
            });
        }
        processorRef.current = null;
      }
    };
  }, [imagePath, mode, blurRadius, enabled, localParticipant, room]);
}

/**
 * Hook to apply virtual background or blur to the local camera track
 *
 * @example
 * ```tsx
 * function VideoComponent() {
 *   const [bgImage, setBgImage] = useState<string | null>(null);
 *
 *   useVirtualBackground({
 *     imagePath: bgImage,
 *     mode: 'virtual-background',
 *     enabled: !!bgImage
 *   });
 *
 *   return (
 *     <button onClick={() => setBgImage('https://example.com/bg.jpg')}>
 *       Apply Background
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Blur background
 * useVirtualBackground({
 *   mode: 'blur',
 *   blurRadius: 10
 * });
 * ```
 */
