

export type HealthData = {
        
        
        responses: {
            GetHealth: {
        status: string
timestamp: string
uptime: number
service: string
    }
                
        }
        
    }

export type LiveKitData = {
        
        payloads: {
            PostLivekitWebhook: {
                        authorization?: string
requestBody?: string
                        
                    };
PostSignalLivekitWebhook: {
                        authorization?: string
requestBody?: string
                        
                    };
        }
        
        
        responses: {
            PostLivekitWebhook: {
        success: boolean
    }
                ,PostSignalLivekitWebhook: {
        success: boolean
    }
                
        }
        
    }

export type CallsData = {
        
        payloads: {
            GetSignalCallsByCallId: {
                        callId: string
                        
                    };
PostSignalCallsByCallIdLeave: {
                        appId: string
callId: string
                        
                    };
PostSignalCallsInitiate: {
                        appId: string
requestBody?: {
        inviteeIds: Array<string>
mode: 'AUDIO' | 'VIDEO'
    }
                        
                    };
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
PostSignalCallsByCallIdRecordingsStart: {
                        appId: string
callId: string
                        
                    };
PostSignalCallsByCallIdRecordingsByRecordingIdStop: {
                        appId: string
callId: string
recordingId: string
                        
                    };
        }
        
        
        responses: {
            GetSignalCallsByCallId: {
        call: {
        id: string
mode: string
state: string
roomName: string
createdAt: string
endedAt: string | null
callerId: string
    }
participants: Array<{
        id: string
userId: string
role: 'HOST' | 'PARTICIPANT' | 'GUEST'
joinState: string
user: {
        firstName: string | null
lastName: string | null
username: string | null
profilePhoto: string | null
    }
createdAt: string
leftAt: string | null
    }>
    }
                ,PostSignalCallsByCallIdLeave: {
        success: boolean
autoEnded?: boolean
call: {
        id: string
mode: string
state: string
roomName: string
createdAt: string
endedAt: string | null
callerId: string
    }
    }
                ,PostSignalCallsInitiate: {
        callId: string
currentUserId: string
call: {
        id: string
state: string
mode: string
roomName: string
createdAt: string
    }
participants: Array<{
        userId: string
username: string | null
firstName: string | null
lastName: string | null
profilePhoto: string | null
    }>
inviteeIds: Array<string>
joinInfo: {
        token: string
lkUrl: string
    }
ringTimeoutMs: number
    }
                ,PostSignalCallsInvite: {
        callId: string
currentUserId: string
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
inviteeIds: Array<string>
joinInfo: {
        token: string
lkUrl: string
    } | null
call: {
        id: string
state: string
mode: string
roomName: string
createdAt: string
    }
ringTimeoutMs: number
    }
                ,PostSignalCallsByCallIdAccept: {
        callId: string
joinInfo: {
        token: string
lkUrl: string
    }
call: {
        id: string
roomName: string
state: string
createdAt: string
startedAt: string | null
    }
ringTimeoutMs: number
    }
                ,PostSignalCallsByCallIdDecline: {
        callId: string
success: boolean
    }
                ,PostSignalCallsByCallIdCancel: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted' | 'left' | 'ended'
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
autoEnded?: boolean
endedForAll?: boolean
    }
                ,PostSignalCallsByCallIdTransfer: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted' | 'left' | 'ended'
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
autoEnded?: boolean
endedForAll?: boolean
    }
                ,PostSignalCallsByCallIdKick: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted' | 'left' | 'ended'
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
autoEnded?: boolean
endedForAll?: boolean
    }
                ,PostSignalCallsByCallIdMute: {
        callId: string
success: boolean
action: 'call_initiated' | 'invite_sent' | 'accepted' | 'declined' | 'cancelled' | 'transfer_initiated' | 'participant_kicked' | 'participant_muted' | 'left' | 'ended'
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
autoEnded?: boolean
endedForAll?: boolean
    }
                ,PostSignalCallsByCallIdEnd: void
                ,PostSignalCallsByCallIdRecordingsStart: {
        status: boolean
message: string
    }
                ,PostSignalCallsByCallIdRecordingsByRecordingIdStop: {
        status: boolean
message: string
    }
                
        }
        
    }

export type MeetingsData = {
        
        payloads: {
            PostSignalMeetingsCreate: {
                        requestBody?: {
        mode?: 'AUDIO' | 'VIDEO'
title?: string
    }
                        
                    };
PostSignalMeetingsByMeetingIdStart: {
                        meetingId: string
                        
                    };
PostSignalMeetingsJoin: {
                        requestBody?: {
        meetingCode?: string
meetingId?: string
    }
                        
                    };
PostSignalMeetingsByMeetingIdEnd: {
                        meetingId: string
                        
                    };
        }
        
        
        responses: {
            PostSignalMeetingsCreate: {
        meeting: {
        id: string
code: string
status: 'ACTIVE'
callId: string
    }
joinInfo: {
        token: string
lkUrl: string
    }
sessionType: 'MEETING'
    }
                ,PostSignalMeetingsByMeetingIdStart: {
        meeting: {
        id: string
code: string
status: 'ACTIVE'
callId: string
    }
joinInfo: {
        token: string
lkUrl: string
    }
sessionType: 'MEETING'
    }
                ,PostSignalMeetingsJoin: {
        meeting: {
        id: string
code: string
status: 'ACTIVE'
callId: string
    }
joinInfo: {
        token: string
lkUrl: string
    }
sessionType: 'MEETING'
    }
                ,PostSignalMeetingsByMeetingIdEnd: {
        success: boolean
meetingId: string
    }
                
        }
        
    }

export type UsersData = {
        
        payloads: {
            GetSignalUsersById: {
                        id: string
                        
                    };
        }
        
        
        responses: {
            GetSignalUsersById: {
        userId: string
username: string | null
firstName: string | null
lastName: string | null
profilePhoto: string | null
    }
                
        }
        
    }

export type PresenceData = {
        
        payloads: {
            PostSignalPresence: {
                        requestBody?: {
        userIds: Array<string>
    }
                        
                    };
        }
        
        
        responses: {
            PostSignalPresence: {
        presence: Array<{
        userId: string
status: 'online' | 'offline' | 'busy'
deviceCount: number
    }>
    }
                
        }
        
    }

export type InitData = {
        
        payloads: {
            GetSignalInit: {
                        appId: string
                        
                    };
        }
        
        
        responses: {
            GetSignalInit: {
        sessionToken: string
sessionId: string
userId: string
deviceId: string
expiresAt: string
    }
                
        }
        
    }