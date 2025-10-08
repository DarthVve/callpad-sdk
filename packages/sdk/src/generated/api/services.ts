import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';
import type { HealthData, UserPresenceData, CallsData } from './models';

export class HealthService {

	/**
	 * @returns any Service is healthy
	 * @throws ApiError
	 */
	public static getHealth(): CancelablePromise<HealthData['responses']['GetHealth']> {
		
		return __request(OpenAPI, {
			method: 'GET',
			url: '/health',
		});
	}

	/**
	 * @returns any Service is healthy
	 * @throws ApiError
	 */
	public static getSignalHealth(): CancelablePromise<HealthData['responses']['GetSignalHealth']> {
		
		return __request(OpenAPI, {
			method: 'GET',
			url: '/signal/health',
		});
	}

}

export class UserPresenceService {

	/**
	 * @returns any User presence retrieved successfully
	 * @throws ApiError
	 */
	public static getSignalPresenceUsersByUserId(data: UserPresenceData['payloads']['GetSignalPresenceUsersByUserId']): CancelablePromise<UserPresenceData['responses']['GetSignalPresenceUsersByUserId']> {
		const {
                    
                    userId
                } = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/signal/presence/users/{userId}',
			path: {
				userId
			},
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				403: `Insufficient permissions`,
				404: `User not found or presence unavailable`,
			},
		});
	}

	/**
	 * @returns any Bulk presence retrieved successfully
	 * @throws ApiError
	 */
	public static getSignalPresenceBulk(data: UserPresenceData['payloads']['GetSignalPresenceBulk']): CancelablePromise<UserPresenceData['responses']['GetSignalPresenceBulk']> {
		const {
                    
                    userIds
                } = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/signal/presence/bulk',
			query: {
				userIds
			},
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				403: `Insufficient permissions`,
			},
		});
	}

}

export class CallsService {

	/**
	 * @returns any Call started successfully
	 * @throws ApiError
	 */
	public static postSignalCalls(data: CallsData['payloads']['PostSignalCalls']): CancelablePromise<CallsData['responses']['PostSignalCalls']> {
		const {
                    
                    appId,
requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/signal/calls',
			query: {
				appId
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
			},
		});
	}

	/**
	 * @returns any Call accepted successfully
	 * @throws ApiError
	 */
	public static postSignalCallsByCallIdAccept(data: CallsData['payloads']['PostSignalCallsByCallIdAccept']): CancelablePromise<CallsData['responses']['PostSignalCallsByCallIdAccept']> {
		const {
                    
                    callId,
appId
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/signal/calls/{callId}/accept',
			path: {
				callId
			},
			query: {
				appId
			},
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				403: `User is not a participant`,
				404: `Call not found`,
				409: `Call cannot be accepted in current state`,
			},
		});
	}

	/**
	 * @returns any Call declined successfully
	 * @throws ApiError
	 */
	public static postSignalCallsByCallIdDecline(data: CallsData['payloads']['PostSignalCallsByCallIdDecline']): CancelablePromise<CallsData['responses']['PostSignalCallsByCallIdDecline']> {
		const {
                    
                    callId,
appId
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/signal/calls/{callId}/decline',
			path: {
				callId
			},
			query: {
				appId
			},
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				403: `User is not a participant`,
				404: `Call not found`,
				409: `Call cannot be declined in current state`,
			},
		});
	}

	/**
	 * @returns any Left call successfully
	 * @throws ApiError
	 */
	public static postSignalCallsByCallIdLeave(data: CallsData['payloads']['PostSignalCallsByCallIdLeave']): CancelablePromise<CallsData['responses']['PostSignalCallsByCallIdLeave']> {
		const {
                    
                    callId,
appId
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/signal/calls/{callId}/leave',
			path: {
				callId
			},
			query: {
				appId
			},
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				403: `User is not a participant`,
				404: `Call not found`,
				409: `Call cannot be left in current state`,
			},
		});
	}

	/**
	 * @returns any Call retrieved successfully
	 * @throws ApiError
	 */
	public static getSignalCallsByCallId(data: CallsData['payloads']['GetSignalCallsByCallId']): CancelablePromise<CallsData['responses']['GetSignalCallsByCallId']> {
		const {
                    
                    callId,
appId
                } = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/signal/calls/{callId}',
			path: {
				callId
			},
			query: {
				appId
			},
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				403: `User does not have access to this call`,
				404: `Call not found`,
			},
		});
	}

	/**
	 * @returns any Participant info retrieved successfully
	 * @throws ApiError
	 */
	public static getSignalCallsParticipantsByIdentity(data: CallsData['payloads']['GetSignalCallsParticipantsByIdentity']): CancelablePromise<CallsData['responses']['GetSignalCallsParticipantsByIdentity']> {
		const {
                    
                    identity,
appId
                } = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/signal/calls/participants/{identity}',
			path: {
				identity
			},
			query: {
				appId
			},
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				404: `Participant not found`,
			},
		});
	}

}