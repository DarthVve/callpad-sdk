import { Microphone, MicrophoneSlash } from "@phosphor-icons/react";
import { useIsSpeaking, Participant, useIsMuted, Track, RemoteParticipant, VideoTrack } from "vg-x07df/livekit";
import { hasVideoTrack } from "vg-x07df/utils";
import { useParticipantMetadata } from "vg-x07df";
import { TrackReference } from "@livekit/components-core";

// Size-specific classes configuration
const SIZE_CLASSES = {
    small: {
        avatar: "w-[3rem] h-[3rem]",
        avatarBorder: "border-2",
        padding: "p-2",
        iconSize: 16,
        initialsText: "text-base",
        nameText: "text-xs"
    },
    medium: {
        avatar: "w-[5rem] h-[5rem]",
        avatarBorder: "border-4",
        padding: "p-3",
        iconSize: 20,
        initialsText: "text-2xl",
        nameText: "text-sm"
    },
    large: {
        avatar: "w-[8rem] h-[8rem]",
        avatarBorder: "border-6",
        padding: "p-4",
        iconSize: 24,
        initialsText: "text-4xl",
        nameText: "text-base"
    }
} as const;

interface ParticipantTileProps {
    participant: Participant;
    size?: "small" | "medium" | "large";
    showMenu?: boolean;
    showHandRaise?: boolean;
    tracks: TrackReference[];
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
    participant,
    size = "medium",
    tracks,
}) => {
    const metadata = useParticipantMetadata(participant as RemoteParticipant);
    const isSpeaking = useIsSpeaking(participant);
    const isMuted = useIsMuted({ participant, source: Track.Source.Microphone });
    const hasVideo = hasVideoTrack(participant);
    const classes = SIZE_CLASSES[size];
    // console.log('participant', participant, metadata);
    const participantVideoTrack = tracks?.find(
        track => track.participant.sid === participant.sid
    );
    if (!participant) {
        return (
            <div className="relative flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-indigo-50 to-blue-50 p-3 shadow-sm border">
                <div className="w-[5rem] h-[5rem] rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">?</span>
                </div>
                <p className="text-sm font-medium text-gray-400 mt-2">Loading...</p>
            </div>
        );
    }

    return (
        <div
            className={`relative flex flex-col items-center justify-center rounded-xl overflow-hidden ${hasVideo ? 'bg-black' : 'bg-gradient-to-b from-indigo-50 to-blue-50'
                } ${classes.padding} shadow-sm transition-all duration-200 ${isSpeaking
                        ? "border-2 border-[#0D6EFD]"
                        : "border"
                }`}
        >
            {hasVideo && (
                <>
                    <div className="absolute inset-0 z-0">
                        <VideoTrack
                            trackRef={participantVideoTrack}
                            className={`w-full h-full object-cover`}
                        />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />
                </>
            )}

            {/* Mic icon */}
            <div className="absolute top-4 right-4 z-20">
                {isMuted ? (
                    <div className="bg-[#EFF7FD] flex items-center justify-center rounded-full border p-1">
                        <MicrophoneSlash size={classes.iconSize} color="#525866" />
                    </div>
                ) : (
                    <div className="bg-[#EFF7FD] flex items-center justify-center border rounded-full p-1">
                        <Microphone size={classes.iconSize} color="#525866" />
                    </div>
                )}
            </div>

            {!hasVideo && (
                <>
                    {metadata?.profilePhoto ? (
                        <img
                            src={metadata.profilePhoto}
                            alt={`${metadata?.firstName} ${metadata?.lastName}`}
                            className={`${classes.avatar} rounded-full object-cover ${classes.avatarBorder} border-white z-10`}
                        />
                    ) : (
                        <div
                            className={`${classes.avatar} rounded-full flex items-center justify-center font-medium ${classes.initialsText} z-10`}
                        >
                            {`${metadata?.firstName} ${metadata?.lastName}`
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
