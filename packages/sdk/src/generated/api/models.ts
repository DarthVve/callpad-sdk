

export type HealthData = {
        
        
        responses: {
            GetHealth: {
        status: string
timestamp: string
uptime: number
service: string
    }
                ,GetSignalHealth: {
        status: string
timestamp: string
uptime: number
service: string
    }
                
        }
        
    }

export type CallsData = {
        
        payloads: {
            PostSignalCallsInvite: {
                        appId: string
requestBody?: {
        participants: Array<{
        userId: string
    }>
mode: 'AUDIO' | 'VIDEO'
callId?: string
    }
                        
                    };
PostSignalCallsByCallIdAccept: {
                        appId: string
callId: string
                        
                    };
PostSignalCallsByCallIdDecline: {
                        appId: string
callId: string
requestBody?: {
        reason?: string
    }
                        
                    };
PostSignalCallsByCallIdCancel: {
                        appId: string
callId: string
                        
                    };
PostSignalCallsByCallIdTransfer: {
                        appId: string
callId: string
requestBody?: {
        targetParticipantId: string
reason?: string
    }
                        
                    };
PostSignalCallsByCallIdKick: {
                        appId: string
callId: string
requestBody?: {
        participantId: string
reason?: string
    }
                        
                    };
PostSignalCallsByCallIdMute: {
                        appId: string
callId: string
requestBody?: {
        participantId: string
    }
                        
                    };
PostSignalCallsByCallIdEnd: {
                        appId: string
callId: string
                        
                    };
PostSignalCallsByCallIdLeave: {
                        appId: string
callId: string
                        
                    };
        }
        
        
        responses: {
            PostSignalCallsInvite: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted'
message: string
    }
                ,PostSignalCallsByCallIdAccept: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted'
message: string
    }
                ,PostSignalCallsByCallIdDecline: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted'
message: string
    }
                ,PostSignalCallsByCallIdCancel: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted'
message: string
    }
                ,PostSignalCallsByCallIdTransfer: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted'
message: string
    }
                ,PostSignalCallsByCallIdKick: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted'
message: string
    }
                ,PostSignalCallsByCallIdMute: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted'
message: string
    }
                ,PostSignalCallsByCallIdEnd: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted'
message: string
    }
                ,PostSignalCallsByCallIdLeave: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted'
message: string
    }
                
        }
        
    }