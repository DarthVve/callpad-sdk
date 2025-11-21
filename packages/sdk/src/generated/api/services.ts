import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';
import type { HealthData, LiveKitData, CallsData, UsersData, InitData } from './models';

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

}

export class LiveKitService {

	/**
	 * @returns any Webhook processed successfully
	 * @throws ApiError
	 */
	public static postLivekitWebhook(data: LiveKitData['payloads']['PostLivekitWebhook'] = {}): CancelablePromise<LiveKitData['responses']['PostLivekitWebhook']> {
		const {
                    
                    authorization,
requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/livekit/webhook',
			headers: {
				authorization
			},
			body: requestBody,
			mediaType: 'text/plain',
			errors: {
				400: `Invalid webhook`,
				500: `Failed to process webhook`,
			},
		});
	}

	/**
	 * @returns any Webhook processed successfully
	 * @throws ApiError
	 */
	public static postSignalLivekitWebhook(data: LiveKitData['payloads']['PostSignalLivekitWebhook'] = {}): CancelablePromise<LiveKitData['responses']['PostSignalLivekitWebhook']> {
		const {
                    
                    authorization,
requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/signal/livekit/webhook',
			headers: {
				authorization
			},
			body: requestBody,
			mediaType: 'text/plain',
			errors: {
				400: `Invalid webhook`,
				500: `Failed to process webhook`,
			},
		});
	}

}

export class CallsService {

	/**
	 * @returns any Call retrieved successfully
	 * @throws ApiError
	 */
	public static getSignalCallsByCallId(data: CallsData['payloads']['GetSignalCallsByCallId']): CancelablePromise<CallsData['responses']['GetSignalCallsByCallId']> {
		const {
                    
                    callId
                } = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/signal/calls/{callId}',
			path: {
				callId
			},
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
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
				403: `User is not a participant`,
				404: `Call not found`,
			},
		});
	}

	/**
	 * @returns any Call initiated successfully
	 * @throws ApiError
	 */
	public static postSignalCallsInitiate(data: CallsData['payloads']['PostSignalCallsInitiate']): CancelablePromise<CallsData['responses']['PostSignalCallsInitiate']> {
		const {
                    
                    appId,
requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/signal/calls/initiate',
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
	 * @returns void Call ended successfully. Room deleted from LiveKit.
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
				403: `Only host can end the call`,
				404: `Call not found`,
			},
		});
	}

	/**
	 * @returns any Recording started successfully
	 * @throws ApiError
	 */
	public static postSignalCallsByCallIdRecordingsStart(data: CallsData['payloads']['PostSignalCallsByCallIdRecordingsStart']): CancelablePromise<CallsData['responses']['PostSignalCallsByCallIdRecordingsStart']> {
		const {
                    
                    callId,
appId
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/signal/calls/{callId}/recordings/start',
			path: {
				callId
			},
			query: {
				appId
			},
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				403: `Only host can start recording`,
				404: `Call not found`,
				409: `A recording is already active`,
			},
		});
	}

	/**
	 * @returns any Recording stopped successfully
	 * @throws ApiError
	 */
	public static postSignalCallsByCallIdRecordingsByRecordingIdStop(data: CallsData['payloads']['PostSignalCallsByCallIdRecordingsByRecordingIdStop']): CancelablePromise<CallsData['responses']['PostSignalCallsByCallIdRecordingsByRecordingIdStop']> {
		const {
                    
                    callId,
recordingId,
appId
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/signal/calls/{callId}/recordings/{recordingId}/stop',
			path: {
				callId, recordingId
			},
			query: {
				appId
			},
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				403: `Only host can stop recording`,
				404: `Call or recording not found`,
			},
		});
	}

}

export class UsersService {

	/**
	 * @returns any User profile retrieved successfully
	 * @throws ApiError
	 */
	public static getSignalUsersById(data: UsersData['payloads']['GetSignalUsersById']): CancelablePromise<UsersData['responses']['GetSignalUsersById']> {
		const {
                    
                    id
                } = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/signal/users/{id}',
			path: {
				id
			},
			errors: {
				400: `Invalid request`,
				401: `Authentication required`,
				404: `User not found`,
			},
		});
	}

}

export class InitService {

	/**
	 * @returns any Initialized
	 * @throws ApiError
	 */
	public static getSignalInit(data: InitData['payloads']['GetSignalInit']): CancelablePromise<InitData['responses']['GetSignalInit']> {
		const {
                    
                    appId
                } = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/signal/init',
			query: {
				appId
			},
			errors: {
				401: `Authentication required`,
				500: `Internal server error`,
			},
		});
	}

}