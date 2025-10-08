

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

export type UserPresenceData = {
        
        payloads: {
            GetSignalPresenceUsersByUserId: {
                        userId: string
                        
                    };
GetSignalPresenceBulk: {
                        userIds: string
                        
                    };
        }
        
        
        responses: {
            GetSignalPresenceUsersByUserId: {
        userId: string
state: 'offline' | 'online' | 'ringing' | 'in_call' | 'dnd'
lastSeen: string
devices: Array<{
        device: 'web' | 'ios' | 'android' | 'unknown'
count: number
    }>
roomIds: Array<string>
callId: string | null
    }
                ,GetSignalPresenceBulk: {
        presences: Array<{
        userId: string
state: 'offline' | 'online' | 'ringing' | 'in_call' | 'dnd'
lastSeen: string
devices: Array<{
        device: 'web' | 'ios' | 'android' | 'unknown'
count: number
    }>
roomIds: Array<string>
callId: string | null
    }>
timestamp: string
    }
                
        }
        
    }

export type CallsData = {
        
        payloads: {
            PostSignalCalls: {
                        appId: string
requestBody?: {
        mode: 'AUDIO' | 'VIDEO'
participants: Array<{
        userId: string
    }>
    }
                        
                    };
PostSignalCallsByCallIdAccept: {
                        appId: string
callId: string
                        
                    };
PostSignalCallsByCallIdDecline: {
                        appId: string
callId: string
                        
                    };
PostSignalCallsByCallIdLeave: {
                        appId: string
callId: string
                        
                    };
GetSignalCallsByCallId: {
                        appId: string
callId: string
                        
                    };
GetSignalCallsParticipantsByIdentity: {
                        appId: string
identity: string
                        
                    };
        }
        
        
        responses: {
            PostSignalCalls: {
        id: string
mode: 'AUDIO' | 'VIDEO'
state: 'ACTIVE' | 'ENDED'
callerId: string
roomName: string
lkRoomSid?: string
createdAt: string
startedAt?: string
endedAt?: string
participants: Array<{
        id: string
userId: string
joinedAt: string
lkIdentity?: string
lkParticipantSid?: string
createdAt: string
updatedAt: string
    }>
    }
                ,PostSignalCallsByCallIdAccept: {
        callId: string
success: boolean
action: 'accepted' | 'declined' | 'left' | 'initiated'
participant?: {
        joinedAt: string
    }
call?: {
        globalState: 'ACTIVE' | 'ENDED'
participantCount?: number
    }
token?: string
roomName?: string
message: string
    }
                ,PostSignalCallsByCallIdDecline: {
        callId: string
success: boolean
action: 'accepted' | 'declined' | 'left' | 'initiated'
participant?: {
        joinedAt: string
    }
call?: {
        globalState: 'ACTIVE' | 'ENDED'
participantCount?: number
    }
token?: string
roomName?: string
message: string
    }
                ,PostSignalCallsByCallIdLeave: {
        callId: string
success: boolean
action: 'accepted' | 'declined' | 'left' | 'initiated'
participant?: {
        joinedAt: string
    }
call?: {
        globalState: 'ACTIVE' | 'ENDED'
participantCount?: number
    }
token?: string
roomName?: string
message: string
    }
                ,GetSignalCallsByCallId: {
        id: string
mode: 'AUDIO' | 'VIDEO'
state: 'ACTIVE' | 'ENDED'
callerId: string
roomName: string
lkRoomSid?: string
createdAt: string
startedAt?: string
endedAt?: string
participants: Array<{
        id: string
userId: string
joinedAt: string
lkIdentity?: string
lkParticipantSid?: string
createdAt: string
updatedAt: string
    }>
    }
                ,GetSignalCallsParticipantsByIdentity: {
        id: string
firstName?: string
lastName?: string
avatarUrl?: string
email?: string
    }
                
        }
        
    }