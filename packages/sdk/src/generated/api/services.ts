import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';
import type { HealthData, CallsData } from './models';

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

export class CallsService {

	/**
	 * @returns any Invites sent successfully
	 * @throws ApiError
	 */
	public static postSignalCallsInvite(data: CallsData['payloads']['PostSignalCallsInvite']): CancelablePromise<CallsData['responses']['PostSignalCallsInvite']> {
		const {
                    
                    appId,
requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/signal/calls/invite',
			query: {
				appId
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				403: `User does not have permission to invite`,
				404: `Call not found`,
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
appId,
requestBody
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
			body: requestBody,
			mediaType: 'application/json',
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
appId,
requestBody
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
			body: requestBody,
			mediaType: 'application/json',
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
	 * @returns any Call cancelled successfully
	 * @throws ApiError
	 */
	public static postSignalCallsByCallIdCancel(data: CallsData['payloads']['PostSignalCallsByCallIdCancel']): CancelablePromise<CallsData['responses']['PostSignalCallsByCallIdCancel']> {
		const {
                    
                    callId,
appId
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/signal/calls/{callId}/cancel',
			path: {
				callId
			},
			query: {
				appId
			},
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				403: `User does not have permission to cancel`,
				404: `Call not found`,
				409: `Call cannot be cancelled in current state`,
			},
		});
	}

	/**
	 * @returns any Transfer initiated successfully
	 * @throws ApiError
	 */
	public static postSignalCallsByCallIdTransfer(data: CallsData['payloads']['PostSignalCallsByCallIdTransfer']): CancelablePromise<CallsData['responses']['PostSignalCallsByCallIdTransfer']> {
		const {
                    
                    callId,
appId,
requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/signal/calls/{callId}/transfer',
			path: {
				callId
			},
			query: {
				appId
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				403: `User does not have permission to transfer`,
				404: `Call not found`,
				409: `Call cannot be transferred in current state`,
			},
		});
	}

	/**
	 * @returns any Participant kicked successfully
	 * @throws ApiError
	 */
	public static postSignalCallsByCallIdKick(data: CallsData['payloads']['PostSignalCallsByCallIdKick']): CancelablePromise<CallsData['responses']['PostSignalCallsByCallIdKick']> {
		const {
                    
                    callId,
appId,
requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/signal/calls/{callId}/kick',
			path: {
				callId
			},
			query: {
				appId
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				403: `User does not have permission to kick`,
				404: `Call not found`,
				409: `Participant cannot be kicked in current state`,
			},
		});
	}

	/**
	 * @returns any Participant muted successfully
	 * @throws ApiError
	 */
	public static postSignalCallsByCallIdMute(data: CallsData['payloads']['PostSignalCallsByCallIdMute']): CancelablePromise<CallsData['responses']['PostSignalCallsByCallIdMute']> {
		const {
                    
                    callId,
appId,
requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/signal/calls/{callId}/mute',
			path: {
				callId
			},
			query: {
				appId
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				403: `User does not have permission to mute`,
				404: `Call not found`,
				409: `Participant cannot be muted in current state`,
			},
		});
	}

	/**
	 * @returns any Call ended successfully
	 * @throws ApiError
	 */
	public static postSignalCallsByCallIdEnd(data: CallsData['payloads']['PostSignalCallsByCallIdEnd']): CancelablePromise<CallsData['responses']['PostSignalCallsByCallIdEnd']> {
		const {
                    
                    callId,
appId
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/signal/calls/{callId}/end',
			path: {
				callId
			},
			query: {
				appId
			},
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				403: `Only host can end call`,
				404: `Call not found`,
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
				404: `Call not found`,
			},
		});
	}

}