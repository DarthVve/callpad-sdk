import { useChatStore } from "../channel/chat";
import { useRaiseHandStore } from "../channel/raiseHand";
import { useSpotlightStore } from "../channel/spotlight";
import { SignalMeetingsService } from "../clients/signal";
import type { MeetingsData } from "../generated/api/models";
import type {
  CreateAdHocMeetingParams,
  EndMeetingResponse,
  JoinMeetingParams,
  MeetingResponse,
} from "../state/meetings.types";
import { profileCache } from "../state/profileCache";
import { recordingStore } from "../state/recording.store";
import { rtcStore } from "../state/store";

export interface MeetingsServiceConfig {
  appId: string;
}

export interface MeetingsServiceDependencies {
  livekitManager?: { disconnect: () => Promise<void> };
}

export function createMeetingsService(
  config: MeetingsServiceConfig,
  deps?: MeetingsServiceDependencies
) {
  const { appId } = config;
  const signalMeetings = new SignalMeetingsService(appId);

  async function createAdHoc(
    params: CreateAdHocMeetingParams = {}
  ): Promise<MeetingsData["responses"]["PostSignalMeetingsCreate"]> {
    try {
      rtcStore.getState().patch((state) => {
        state.session = {
          id: "temp",
          status: "initializing",
          mode: params.mode || "VIDEO",
          role: "HOST",
          sessionType: "MEETING",
        };
        state.initiated = true;
      });

      const requestBody: { mode?: "AUDIO" | "VIDEO"; title?: string } = {};
      if (params.mode) {
        requestBody.mode = params.mode;
      }
      if (params.title) {
        requestBody.title = params.title;
      }

      const response = await signalMeetings.createAdHoc({
        requestBody,
      });

      rtcStore.getState().patch((state) => {
        state.initiated = true;
        state.session = {
          id: response.meeting.callId,
          status: "active",
          mode: params.mode || "VIDEO",
          role: "HOST",
          sessionType: "MEETING",
          meetingInfo: {
            meetingId: response.meeting.id,
            meetingCode: response.meeting.code,
          },
          livekitInfo: {
            token: response.joinInfo.token,
            roomName: response.meeting.callId,
            url: response.joinInfo.lkUrl,
          },
        };
      });

      return response;
    } catch (error: any) {
      rtcStore.getState().patch((state) => {
        state.session = null;
        state.initiated = false;
      });
      rtcStore.getState().addError({
        code: "CREATE_MEETING_FAILED",
        message: error.message || "Failed to create meeting",
        timestamp: Date.now(),
        context: error,
      });
      throw error;
    }
  }

  async function start(
    meetingId: string
  ): Promise<MeetingsData["responses"]["PostSignalMeetingsByMeetingIdStart"]> {
    try {
      rtcStore.getState().patch((state) => {
        state.session = {
          id: "temp",
          status: "initializing",
          mode: "VIDEO",
          role: "HOST",
          sessionType: "MEETING",
        };
        state.initiated = true;
      });

      const response = await signalMeetings.start({
        meetingId,
      });

      rtcStore.getState().patch((state) => {
        state.initiated = true;
        state.session = {
          id: response.meeting.callId,
          status: "active",
          mode: "VIDEO",
          role: "HOST",
          sessionType: "MEETING",
          meetingInfo: {
            meetingId: response.meeting.id,
            meetingCode: response.meeting.code,
          },
          livekitInfo: {
            token: response.joinInfo.token,
            roomName: response.meeting.callId,
            url: response.joinInfo.lkUrl,
          },
        };
      });

      return response;
    } catch (error: any) {
      rtcStore.getState().patch((state) => {
        state.session = null;
        state.initiated = false;
      });
      rtcStore.getState().addError({
        code: "START_MEETING_FAILED",
        message: error.message || "Failed to start meeting",
        timestamp: Date.now(),
        context: error,
      });
      throw error;
    }
  }

  async function join(
    params: JoinMeetingParams
  ): Promise<MeetingsData["responses"]["PostSignalMeetingsJoin"]> {
    if (!params.meetingCode && !params.meetingId) {
      throw new Error("Either meetingCode or meetingId is required");
    }

    try {
      rtcStore.getState().patch((state) => {
        state.session = {
          id: "temp",
          status: "initializing",
          mode: "VIDEO",
          role: "PARTICIPANT",
          sessionType: "MEETING",
        };
        state.initiated = false;
      });

      const requestBody: { meetingCode?: string; meetingId?: string } = {};
      if (params.meetingCode) {
        requestBody.meetingCode = params.meetingCode;
      }
      if (params.meetingId) {
        requestBody.meetingId = params.meetingId;
      }

      const response = await signalMeetings.join({
        requestBody,
      });

      rtcStore.getState().patch((state) => {
        state.session = {
          id: response.meeting.callId,
          status: "active",
          mode: "VIDEO",
          role: "PARTICIPANT",
          sessionType: "MEETING",
          meetingInfo: {
            meetingId: response.meeting.id,
            meetingCode: response.meeting.code,
          },
          livekitInfo: {
            token: response.joinInfo.token,
            roomName: response.meeting.callId,
            url: response.joinInfo.lkUrl,
          },
        };
      });

      return response;
    } catch (error: any) {
      rtcStore.getState().patch((state) => {
        state.session = null;
      });
      rtcStore.getState().addError({
        code: "JOIN_MEETING_FAILED",
        message: error.message || "Failed to join meeting",
        timestamp: Date.now(),
        context: error,
      });
      throw error;
    }
  }

  async function end(
    meetingId: string
  ): Promise<MeetingsData["responses"]["PostSignalMeetingsByMeetingIdEnd"]> {
    try {
      const response = await signalMeetings.end({
        meetingId,
      });

      rtcStore.getState().reset();
      profileCache.getState().clear();
      recordingStore.getState().clear();
      useChatStore.getState().clearChat();
      useSpotlightStore.getState().clear();
      useRaiseHandStore.getState().clear();

      return response;
    } catch (error: any) {
      rtcStore.getState().addError({
        code: "END_MEETING_FAILED",
        message: error.message || "Failed to end meeting",
        timestamp: Date.now(),
        context: error,
      });
      throw error;
    }
  }

  async function leave(): Promise<void> {
    try {
      if (deps?.livekitManager) {
        await deps.livekitManager.disconnect();
      } else {
        rtcStore.getState().reset();
        profileCache.getState().clear();
        recordingStore.getState().clear();
        useChatStore.getState().clearChat();
        useSpotlightStore.getState().clear();
        useRaiseHandStore.getState().clear();
      }
    } catch (error: any) {
      rtcStore.getState().addError({
        code: "LEAVE_MEETING_FAILED",
        message: error.message || "Failed to leave meeting",
        timestamp: Date.now(),
        context: error,
      });
      throw error;
    }
  }

  return {
    createAdHoc,
    start,
    join,
    end,
    leave,
  };
}

export type MeetingsServiceInstance = ReturnType<typeof createMeetingsService>;
