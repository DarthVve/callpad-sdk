

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
            GetSignalPresenceByUserId: {
                        userId: string
                        
                    };
GetSignalPresenceBulk: {
                        userIds: string
                        
                    };
        }
        
        
        responses: {
            GetSignalPresenceByUserId: {
        userId: number
status: 'online' | 'offline'
lastActive: number
connections: Array<{
        connectionId: string
connectedAt: number
lastActive: number
state: 'connecting' | 'connected' | 'disconnecting' | 'disconnected'
metadata?: {
        device?: string
    }
    }>
timestamp: number
    }
                ,GetSignalPresenceBulk: {
        presences: Array<{
        userId: number
status: 'online' | 'offline'
lastActive: number
connections: Array<{
        connectionId: string
connectedAt: number
lastActive: number
state: 'connecting' | 'connected' | 'disconnecting' | 'disconnected'
metadata?: {
        device?: string
    }
    }>
timestamp: number
    }>
timestamp: number
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
        }
        
        
        responses: {
            PostSignalCalls: {
        id: string
mode: 'AUDIO' | 'VIDEO'
state: 'RINGING' | 'ACTIVE' | 'ON_HOLD' | 'ENDED'
callerId: string
roomName: string
lkRoomSid?: string
createdAt: string
startedAt?: string
endedAt?: string
participants: Array<{
        id: string
userId: string
joinedAt?: string
leftAt?: string
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
        inviteState: 'INVITED' | 'REMINDED' | 'ACCEPTED' | 'DECLINED' | 'MISSED' | 'TIMEOUT'
joinState: 'NOT_JOINED' | 'JOINING' | 'JOINED' | 'LEFT' | 'KICKED'
respondedAt?: string
joinedAt?: string
leftAt?: string
    }
call?: {
        globalState: 'RINGING' | 'ACTIVE' | 'ON_HOLD' | 'ENDED'
activeParticipants?: number
pendingParticipants?: number
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
        inviteState: 'INVITED' | 'REMINDED' | 'ACCEPTED' | 'DECLINED' | 'MISSED' | 'TIMEOUT'
joinState: 'NOT_JOINED' | 'JOINING' | 'JOINED' | 'LEFT' | 'KICKED'
respondedAt?: string
joinedAt?: string
leftAt?: string
    }
call?: {
        globalState: 'RINGING' | 'ACTIVE' | 'ON_HOLD' | 'ENDED'
activeParticipants?: number
pendingParticipants?: number
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
        inviteState: 'INVITED' | 'REMINDED' | 'ACCEPTED' | 'DECLINED' | 'MISSED' | 'TIMEOUT'
joinState: 'NOT_JOINED' | 'JOINING' | 'JOINED' | 'LEFT' | 'KICKED'
respondedAt?: string
joinedAt?: string
leftAt?: string
    }
call?: {
        globalState: 'RINGING' | 'ACTIVE' | 'ON_HOLD' | 'ENDED'
activeParticipants?: number
pendingParticipants?: number
    }
token?: string
roomName?: string
message: string
    }
                ,GetSignalCallsByCallId: {
        id: string
mode: 'AUDIO' | 'VIDEO'
state: 'RINGING' | 'ACTIVE' | 'ON_HOLD' | 'ENDED'
callerId: string
roomName: string
lkRoomSid?: string
createdAt: string
startedAt?: string
endedAt?: string
participants: Array<{
        id: string
userId: string
joinedAt?: string
leftAt?: string
lkIdentity?: string
lkParticipantSid?: string
createdAt: string
updatedAt: string
    }>
    }
                
        }
        
    }