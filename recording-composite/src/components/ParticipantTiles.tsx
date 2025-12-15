import { Microphone, MicrophoneSlash } from "@phosphor-icons/react";
import { useIsSpeaking, Participant, useIsMuted, Track, RemoteParticipant, VideoTrack } from "vg-x07df/livekit";
import { hasVideoTrack } from "vg-x07df/utils";
import { ParticipantMetadata, useParticipantMetadata } from "vg-x07df";
import { TrackReference } from "@livekit/components-core";
import './Composite.css';

// Color palette for participant initials backgrounds
const PARTICIPANT_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#14B8A6', // Teal
];

// Size-specific classes configuration
const SIZE_CLASSES = {
    small: {
        avatar: "participant-tile-avatar-small",
        iconSize: 12,
        initialsText: "participant-tile-initials-small",
        nameText: "participant-tile-name-small"
    },
    medium: {
        avatar: "participant-tile-avatar-medium",
        iconSize: 16,
        initialsText: "participant-tile-initials-medium",
        nameText: "participant-tile-name-medium"
    },
    large: {
        avatar: "participant-tile-avatar-large",
        iconSize: 24,
        initialsText: "participant-tile-initials-large",
        nameText: "participant-tile-name-large"
    }
} as const;

interface ParticipantTileProps {
    participant: Participant;
    tracks?: TrackReference[];
    mainTrack?: TrackReference;
    size?: "small" | "medium" | "large";
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
    participant,
    tracks,
    size = "small",
}) => {
    const metadata = useParticipantMetadata(participant as RemoteParticipant);
    const isSpeaking = useIsSpeaking(participant);
    const isMuted = useIsMuted({ participant, source: Track.Source.Microphone });
    const hasVideo = hasVideoTrack(participant);

    const participantVideoTrack = tracks?.find(
        track => track?.participant?.sid === participant?.sid
    );

    if (!participant) {
        return (
            <div className="participant-tile participant-tile-loading">
                <div className="participant-tile-avatar-loading">
                    <span className="participant-tile-loading-text">?</span>
                </div>
                <p className="participant-tile-loading-label">Loading...</p>
            </div>
        );
    }

    return (
        <div
            className={`participant-tile ${hasVideo ? 'participant-tile-with-video' : 'participant-tile-no-video'
                } ${!hasVideo ? 'participant-tile-padding-medium' : ''} ${isSpeaking
                    ? "participant-tile-speaking"
                    : "participant-tile-not-speaking"
                }`}
        >
            {/* Mic icon */}
            <div className="participant-tile-mic-container">
                {isMuted ? (
                    <div className="participant-tile-mic-icon">
                        <MicrophoneSlash size={SIZE_CLASSES[size].iconSize} color="#525866" />
                    </div>
                ) : (
                    <div className="participant-tile-mic-icon">
                        <Microphone size={SIZE_CLASSES[size].iconSize} color="#525866" />
                    </div>
                )}
            </div>

            {hasVideo && participantVideoTrack && (
                <>
                    <div className="participant-tile-video-container">
                        <VideoTrack
                            trackRef={participantVideoTrack}
                            className="participant-tile-video"
                        />
                    </div>
                    <div className="participant-tile-video-overlay" />
                    <div className={`participant-tile-name ${SIZE_CLASSES[size].nameText} participant-tile-name-overlay`}>
                        {getDisplayName(metadata!, participant)}
                    </div>
                </>
            )}

            {!hasVideo && (
                <>
                    {metadata?.profilePhoto ? (
                        <img
                            src={metadata.profilePhoto}
                            alt={getDisplayName(metadata, participant)}
                            className={`participant-tile-avatar ${SIZE_CLASSES[size].avatar} participant-tile-avatar-image`}
                        />
                    ) : (
                        <div
                            className={`participant-tile-avatar ${SIZE_CLASSES[size].avatar} ${SIZE_CLASSES[size].initialsText} participant-tile-initials-container`}
                            style={{ backgroundColor: getParticipantColor(participant) }}
                        >
                            {getInitials(metadata!, participant)}
                        </div>
                    )}
                    <div className={`participant-tile-name ${SIZE_CLASSES[size].nameText}`}>
                        {getDisplayName(metadata!, participant)}
                    </div>
                </>
            )}
        </div>
    );
}

export const ParticipantTileWide: React.FC<ParticipantTileProps> = ({
    participant,
    mainTrack,
    size = "large",
}) => {
    const metadata = useParticipantMetadata(participant as RemoteParticipant);
    const isSpeaking = useIsSpeaking(participant);
    const hasVideo = hasVideoTrack(participant);

    if (!participant) {
        return (
            <div className="participant-tile participant-tile-loading">
                <div className="participant-tile-avatar-loading">
                    <span className="participant-tile-loading-text">?</span>
                </div>
                <p className="participant-tile-loading-label">Loading...</p>
            </div>
        );
    }

    return (
        <div
            style={{ borderRadius: '0' }}
            className={`participant-tile ${hasVideo ? 'participant-tile-with-video' : 'participant-tile-no-video'
                } ${!hasVideo ? 'participant-tile-padding-medium' : ''} ${isSpeaking ? 'participant-tile-speaking'  : "participant-tile-not-speaking"
}`}
        >
            {hasVideo && mainTrack && (
                <>
                    <VideoTrack
                        trackRef={mainTrack}
                        className="participant-tile-video"
                        style={{ borderRadius: '0' }}
                    />
                    {!mainTrack && <div className="participant-tile-video-overlay" style={{ borderRadius: '0' }} />}
                    <div className={`participant-tile-wide-name`}>
                        <p className="participant-tile-wide-name-text">{getDisplayName(metadata!, participant)}</p>
                    </div>
                </>
            )}

            {!hasVideo && (
                <>
                    {metadata?.profilePhoto ? (
                        <img
                            src={metadata.profilePhoto}
                            alt={getDisplayName(metadata, participant)}
                            className={`participant-tile-avatar ${SIZE_CLASSES[size].avatar} participant-tile-avatar-image`}
                        />
                    ) : (
                        <div
                            className={`participant-tile-avatar ${SIZE_CLASSES[size].avatar} ${SIZE_CLASSES[size].initialsText} participant-tile-initials-container`}
                            style={{ backgroundColor: getParticipantColor(participant) }}
                        >
                            {getInitials(metadata!, participant)}
                        </div>
                    )}
                    <div className={`participant-tile-wide-name`}>
                        <p className="participant-tile-wide-name-text">{getDisplayName(metadata!, participant)}</p>
                    </div>
                </>
            )}
        </div>
    );
}

// Static test data fallback for names when metadata is not available
const getDisplayName = (metadata: ParticipantMetadata, participant: Participant) => {
    if (metadata?.firstName && metadata?.lastName) {
        return `${metadata.firstName} ${metadata.lastName}`;
    }

    const fallbackName = participant?.name || participant?.identity || 'Unknown User';
    return fallbackName;
};

const getInitials = (metadata: ParticipantMetadata, participant: Participant) => {
    const displayName = getDisplayName(metadata, participant);
    if (metadata?.firstName && metadata?.lastName) {
        const initials = `${metadata.firstName} ${metadata.lastName}`
            .split(" ")
            .map((n) => n?.[0])
            .filter(Boolean)
            .join("")
            .toUpperCase()
            .slice(0, 2);
        return initials;
    }

    const initials = displayName
        ?.split(" ")
        .map((n) => n?.[0])
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .slice(0, 2) || '??';
    return initials;
};

// Get a consistent color for a participant based on their identity
const getParticipantColor = (participant: Participant) => {
    const identifier = participant?.identity || participant?.sid || participant?.name || 'default';
    // Simple hash function to convert string to number
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
        hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Use absolute value and modulo to get index
    const colorIndex = Math.abs(hash) % PARTICIPANT_COLORS.length;
    return PARTICIPANT_COLORS[colorIndex];
};