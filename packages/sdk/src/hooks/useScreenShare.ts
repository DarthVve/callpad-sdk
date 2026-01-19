import { useCallback } from "react";
import {
    useTracks,
    useLocalParticipant,
    useRoomContext,
} from "@livekit/components-react"
import { Track } from "livekit-client";

export const useScreenShare = () => {
    const room = useRoomContext();
    const localParticipant = useLocalParticipant();

    // Get all video tracks
    const videoTracks = useTracks([Track.Source.ScreenShare], {
        onlySubscribed: false
    });

    // Check if local participant is screen sharing
    const isLocalScreenSharing = localParticipant?.isScreenShareEnabled || false;

    // Check if any remote participant is screen sharing
    const screenShareTracks = videoTracks.filter(
        (track) => track.source === Track.Source.ScreenShare,
    );

    const isScreenSharing = screenShareTracks.length > 0;

    const handleScreenShare = async () => {
        if (isScreenSharing) {
            handleStopScreenShare();
            return;
        }
        try {
            await room?.localParticipant?.setScreenShareEnabled(true, {
                audio: true,
                video: true,
            });
        } catch (error) {
            console.error("Error accessing display media:", error);
            // Handle user cancellation or permission denial
            const err = error as any;
            if (err?.name === "NotAllowedError") {
                console.error("Permission denied to access display media");
            } else if (err?.name === "AbortError") {
                console.error("Screen sharing aborted");
            }
        }
    };

    const handleStopScreenShare = useCallback(async () => {
        try {
            room?.localParticipant?.setScreenShareEnabled(false);
        } catch (error) {
            console.error("Error stopping screen sharing:", error);
        }
    }, [room?.localParticipant]);

    return {
        isLocalScreenSharing,
        isScreenSharing,
        screenShareTracks,
        handleScreenShare,
        handleStopScreenShare,
    };
};
