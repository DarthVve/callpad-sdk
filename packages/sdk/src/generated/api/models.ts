

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
mode?: 'AUDIO' | 'VIDEO'
callId?: string
    }
                        
                    };
PostSignalCallsByCallIdAccept: {
                        appId: string
callId: string
requestBody?: {
        inviteId: string
    }
                        
                    };
PostSignalCallsByCallIdDecline: {
                        appId: string
callId: string
requestBody?: {
        inviteId: string
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
status: string
participants: Array<{
        userId: string
status: 'invited'
role: 'HOST' | 'PARTICIPANT'
firstName: string | null
lastName: string | null
username: string | null
email: string | null
profilePhoto: string | null
    }>
joinInfo: {
        token: string
lkUrl: string
    } | null
    }
                ,PostSignalCallsByCallIdAccept: {
        callId: string
joinInfo: {
        token: string
lkUrl: string
    }
    }
                ,PostSignalCallsByCallIdDecline: {
        callId: string
success: boolean
    }
                ,PostSignalCallsByCallIdCancel: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted'
message: string
invitedParticipants?: Array<{
        userId: string
status: 'invited'
role: 'HOST' | 'PARTICIPANT'
firstName: string | null
lastName: string | null
username: string | null
email: string | null
profilePhoto: string | null
    }>
    }
                ,PostSignalCallsByCallIdTransfer: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted'
message: string
invitedParticipants?: Array<{
        userId: string
status: 'invited'
role: 'HOST' | 'PARTICIPANT'
firstName: string | null
lastName: string | null
username: string | null
email: string | null
profilePhoto: string | null
    }>
    }
                ,PostSignalCallsByCallIdKick: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted'
message: string
invitedParticipants?: Array<{
        userId: string
status: 'invited'
role: 'HOST' | 'PARTICIPANT'
firstName: string | null
lastName: string | null
username: string | null
email: string | null
profilePhoto: string | null
    }>
    }
                ,PostSignalCallsByCallIdMute: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted'
message: string
invitedParticipants?: Array<{
        userId: string
status: 'invited'
role: 'HOST' | 'PARTICIPANT'
firstName: string | null
lastName: string | null
username: string | null
email: string | null
profilePhoto: string | null
    }>
    }
                ,PostSignalCallsByCallIdEnd: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted'
message: string
invitedParticipants?: Array<{
        userId: string
status: 'invited'
role: 'HOST' | 'PARTICIPANT'
firstName: string | null
lastName: string | null
username: string | null
email: string | null
profilePhoto: string | null
    }>
    }
                ,PostSignalCallsByCallIdLeave: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted'
message: string
invitedParticipants?: Array<{
        userId: string
status: 'invited'
role: 'HOST' | 'PARTICIPANT'
firstName: string | null
lastName: string | null
username: string | null
email: string | null
profilePhoto: string | null
    }>
    }
                
        }
        
    }