import type { CallRecordingStoppedEvent } from "../../../generated/socket";
import { callRecordingStoppedSchema } from "../../../generated/socket";
import { pushStaleEventError } from "../../../state/errors";
import { recordingStore } from "../../../state/recording.store";
import { rtcStore } from "../../../state/store";
import { SdkEventType, eventBus } from "../../events";
import { BaseSocketHandler } from "./base.handler";

/**
 * Handles recording stopped event (call:recordingStopped)
 *
 * Clears recording state when recording stops
 */
export class RecordingStoppedHandler extends BaseSocketHandler<CallRecordingStoppedEvent> {
  protected readonly eventName = "call:recordingStopped";
  protected readonly schema = callRecordingStoppedSchema;

  protected handle(data: CallRecordingStoppedEvent): void {
    const currentState = rtcStore.getState();

    this.logger.debug("Recording stopped event received", {
      callId: data.callId,
      recordingId: data.recordingId,
      egressId: data.egressId,
      currentSessionId: currentState.session?.id,
    });

    try {
      // Clear shared recording store for ALL participants (regardless of session state)
      // This ensures all participants know recording has stopped
      recordingStore.getState().clear();

      this.logger.debug("Recording store cleared for all participants", {
        isRecording: recordingStore.getState().isRecording,
      });

      // Only update session state if session matches (for backward compatibility)
      if (currentState.session?.id === data.callId) {
        this.updateStore((state) => {
          if (state.session && state.session.id === data.callId) {
            state.session.recording = null;
          }
        });
        this.logger.debug("Session recording state cleared", {
          callId: data.callId,
        });
      } else {
        pushStaleEventError("call:recordingStopped", "callId mismatch", {
          eventCallId: data.callId,
          sessionCallId: currentState.session?.id,
        });
        this.logger.warn(
          "Session callId mismatch, but recording state cleared for all participants",
          {
            callId: data.callId,
            sessionCallId: currentState.session?.id,
          }
        );
      }

      eventBus.emit(SdkEventType.RECORDING_STOPPED, {
        callId: data.callId,
        recordingId: data.recordingId,
        egressId: data.egressId,
        timestamp: Date.now(),
      });

      this.logger.info("Recording stopped event processed successfully", {
        callId: data.callId,
        recordingId: data.recordingId,
      });
    } catch (error) {
      this.logger.error("Error processing recording stopped event", {
        error,
        callId: data.callId,
        recordingId: data.recordingId,
      });
      throw error;
    }
  }
}
