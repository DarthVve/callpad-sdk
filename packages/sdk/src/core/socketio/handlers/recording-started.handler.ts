import type { CallRecordingStartedEvent } from "../../../generated/socket";
import { callRecordingStartedSchema } from "../../../generated/socket";
import { pushStaleEventError } from "../../../state/errors";
import { recordingStore } from "../../../state/recording.store";
import { rtcStore } from "../../../state/store";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles recording started event (call:recordingStarted)
 *
 * Updates session recording state when recording starts
 */
export class RecordingStartedHandler extends BaseSocketHandler<CallRecordingStartedEvent> {
  protected readonly eventName = "call:recordingStarted";
  protected readonly schema = callRecordingStartedSchema;

  protected handle(data: CallRecordingStartedEvent): void {
    const currentState = rtcStore.getState();

    this.logger.debug("Recording started event received", {
      callId: data.callId,
      recordingId: data.recordingId,
      egressId: data.egressId,
      state: data.state,
      initiatedBy: data.initiatedBy,
      startedAt: data.startedAt,
      currentSessionId: currentState.session?.id,
    });

    try {
      // This ensures all participants know recording has started
      recordingStore.getState().setRecording({
        recordingId: data.recordingId,
        egressId: data.egressId,
        state: data.state,
        initiatedBy: data.initiatedBy,
        startedAt: data.startedAt,
      });

      this.logger.debug("Recording store updated for all participants", {
        recordingId: data.recordingId,
        isRecording: recordingStore.getState().isRecording,
      });

      // Only update session state if session matches (for backward compatibility)
      if (currentState.session?.id === data.callId) {
        this.updateStore((state) => {
          if (state.session && state.session.id === data.callId) {
            state.session.recording = {
              recordingId: data.recordingId,
              egressId: data.egressId,
              state: data.state,
              startedAt: data.startedAt,
              initiatedBy: data.initiatedBy,
            };
          }
        });
        this.logger.debug("Session recording state updated", {
          callId: data.callId,
        });
      } else {
        pushStaleEventError("call:recordingStarted", "callId mismatch", {
          eventCallId: data.callId,
          sessionCallId: currentState.session?.id,
        });
        this.logger.warn("Session callId mismatch, but recording state updated for all participants", {
          callId: data.callId,
          sessionCallId: currentState.session?.id,
        });
      }

      eventBus.emit(SdkEventType.RECORDING_STARTED, {
        callId: data.callId,
        recordingId: data.recordingId,
        egressId: data.egressId,
        startedAt: data.startedAt,
        timestamp: Date.now(),
      });

      this.logger.info("Recording started event processed successfully", {
        callId: data.callId,
        recordingId: data.recordingId,
      });
    } catch (error) {
      this.logger.error("Error processing recording started event", {
        error,
        callId: data.callId,
        recordingId: data.recordingId,
      });
      throw error;
    }
  }
}

