import { type Room, Track } from "livekit-client";
import { useTracks } from "@livekit/components-react";
import EgressHelper from "@livekit/egress-sdk";
import { useEffect, useState } from "react";

const FRAME_DECODE_TIMEOUT = 5000;

function useRecording(room: Room) {
    EgressHelper.setRoom(room);
    const [hasScreenShare, setHasScreenShare] = useState(false);
    const screenshareTracks = useTracks([Track.Source.ScreenShare], {
        onlySubscribed: true,
    });

    // determines when to start recording
    // the algorithm used is:
    // * if there are video tracks published, wait for frames to be decoded
    // * if there are no video tracks published, start immediately
    // * if it's been more than 10s, record as long as there are tracks subscribed
    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(async () => {
            let shouldStartRecording = false;
            let hasVideoTracks = false;
            let hasSubscribedTracks = false;
            let hasDecodedFrames = false;
            for (const p of Array.from(room.remoteParticipants.values())) {
                for (const pub of Array.from(p.trackPublications.values())) {
                    if (pub.isSubscribed) {
                        hasSubscribedTracks = true;
                    }
                    if (pub.kind === Track.Kind.Video) {
                        hasVideoTracks = true;
                        if (pub.videoTrack) {
                            const stats = await pub.videoTrack.getRTCStatsReport();
                            if (stats) {
                                hasDecodedFrames = Array.from(stats).some(
                                    (item) => item[1].type === 'inbound-rtp' && item[1].framesDecoded > 0,
                                );
                            }
                        }
                    }
                }
            }

            const timeDelta = Date.now() - startTime;
            if (hasDecodedFrames) {
                shouldStartRecording = true;
            } else if (!hasVideoTracks && hasSubscribedTracks && timeDelta > 500) {
                // adding a small timeout to ensure video tracks has a chance to be published
                shouldStartRecording = true;
            } else if (timeDelta > FRAME_DECODE_TIMEOUT && hasSubscribedTracks) {
                shouldStartRecording = true;
            }

            if (shouldStartRecording) {
                EgressHelper.startRecording();
                clearInterval(interval);
            }
        }, 100);
        /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, []);

    // determines if the user is sharing their screen
    useEffect(() => {
        if (screenshareTracks.length > 0 && screenshareTracks[0].publication) {
            setHasScreenShare(true);
        } else {
            setHasScreenShare(false);
        }
    }, [screenshareTracks]);

    const allTracks = useTracks(
        [Track.Source.Camera, Track.Source.ScreenShare, Track.Source.Unknown],
        {
            onlySubscribed: true,
        },
    );

    const remoteVideoTracks = allTracks.filter(
        (tr) =>
            tr.publication.kind === Track.Kind.Video &&
            tr.participant.identity !== room.localParticipant.identity,
    );

    const isAudioOnly = remoteVideoTracks.length === 0;

    return {
        hasScreenShare,
        remoteVideoTracks,
        isAudioOnly,
    }
}

export default useRecording;