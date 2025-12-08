import { Microphone, MicrophoneSlash } from "@phosphor-icons/react";
import { useIsSpeaking, Participant, useIsMuted, Track, RemoteParticipant, VideoTrack } from "vg-x07df/livekit";
import { hasVideoTrack } from "vg-x07df/utils";
import { useParticipantMetadata } from "vg-x07df";
import { TrackReference } from "@livekit/components-core";
import './Composite.css';

interface ParticipantTileProps {
    participant: Participant;
    tracks: TrackReference[];
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
    participant,
    tracks,
}) => {
    const metadata = useParticipantMetadata(participant as RemoteParticipant);
    const isSpeaking = useIsSpeaking(participant);
    const isMuted = useIsMuted({ participant, source: Track.Source.Microphone });
    const hasVideo = hasVideoTrack(participant);
    // console.log('participant', participant, metadata);
    const participantVideoTrack = tracks?.find(
        track => track?.participant?.sid === participant?.sid
    );
    
    // Static test data fallback for names when metadata is not available
    const getDisplayName = () => {
        if (metadata?.firstName && metadata?.lastName) {
            return `${metadata.firstName} ${metadata.lastName}`;
        }
        
        const fallbackName = participant?.name || participant?.identity || 'Unknown User';
        console.log('getDisplayName - metadata:', metadata, 'fallback:', fallbackName);
        return fallbackName;
    };
    
    const getInitials = () => {
        const displayName = getDisplayName();
        if (metadata?.firstName && metadata?.lastName) {
            const initials = `${metadata.firstName} ${metadata.lastName}`
                .split(" ")
                .map((n) => n?.[0])
                .filter(Boolean)
                .join("")
                .toUpperCase()
                .slice(0, 2);
            console.log('getInitials - from metadata:', initials);
            return initials;
        }
        
        const initials = displayName
            ?.split(" ")
            .map((n) => n?.[0])
            .filter(Boolean)
            .join("")
            .toUpperCase()
            .slice(0, 2) || '??';
        console.log('getInitials - from fallback:', initials);
        return initials;
    };
    
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
            {hasVideo && participantVideoTrack && (
                <>
                    <div className="participant-tile-video-container">
                        <VideoTrack
                            trackRef={participantVideoTrack}
                            className="participant-tile-video"
                        />
                    </div>
                    <div className="participant-tile-video-overlay" />
                    <div className="participant-tile-name participant-tile-name-medium participant-tile-name-overlay">
                        {getDisplayName()}
                    </div>
                </>
            )}
            
            {/* Mic icon */}
            <div className="participant-tile-mic-container">
                {isMuted ? (
                    <div className="participant-tile-mic-icon">
                        <MicrophoneSlash size={12} color="#525866" />
                    </div>
                ) : (
                    <div className="participant-tile-mic-icon">
                        <Microphone size={12} color="#525866" />
                    </div>
                )}
            </div>

            {!hasVideo && (
                <>
                    {metadata?.profilePhoto ? (
                        <img
                            src={metadata.profilePhoto}
                            alt={getDisplayName()}
                            className="participant-tile-avatar participant-tile-avatar-medium participant-tile-avatar-border-medium participant-tile-avatar-image"
                        />
                    ) : (
                        <div
                            className="participant-tile-avatar participant-tile-avatar-medium participant-tile-initials-medium participant-tile-initials-container"
                        >
                            {getInitials()}
                        </div>
                    )}
                    <div className="participant-tile-name participant-tile-name-medium">
                        {getDisplayName()}
                    </div>
                </>
            )}
        </div>
    );
}
