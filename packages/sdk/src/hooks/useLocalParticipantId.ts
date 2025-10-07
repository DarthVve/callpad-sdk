import { useSdk } from "../provider/RtcProvider";

/**
 * Hook to get the local participant's identity from LiveKit
 * Returns the actual participant ID that should be used for track lookups
 */
export function useLocalParticipantId(): string | null {
  const sdk = useSdk();
  
  if (!sdk.livekit?.room?.localParticipant) {
    return null;
  }
  
  return sdk.livekit.room.localParticipant.identity;
}

/**
 * Hook to check if a participant ID is the local participant
 */
export function useIsLocalParticipant(participantId: string): boolean {
  const localParticipantId = useLocalParticipantId();
  return localParticipantId === participantId;
}