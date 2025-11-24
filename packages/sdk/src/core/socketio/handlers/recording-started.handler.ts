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

    this.logger.info("Recording started", {
      callId: data.callId,
      recordingId: data.recordingId,
      egressId: data.egressId,
    });

    if (currentState.session?.id !== data.callId) {
      pushStaleEventError("call:recordingStarted", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session?.id,
      });
      this.logger.warn("Ignoring recording started event for different call", {
        callId: data.callId,
      });
      return;
    }

    // Update session state (for backward compatibility)
    this.updateStore((state) => {
      if (state.session && state.session.id === data.callId) {
        // Only update if all of the fields are NOT undefined
        if (
          data.recordingId !== undefined &&
          data.egressId !== undefined &&
          data.state !== undefined &&
          data.startedAt !== undefined
        ) {
          state.session.recording = {
            recordingId: data.recordingId,
            egressId: data.egressId,
            state: data.state,
            startedAt: data.startedAt,
          };
        }
      }
    });

    // Update shared recording store (available to all participants)
    if (
      data.recordingId !== undefined &&
      data.egressId !== undefined &&
      data.state !== undefined &&
      data.startedAt !== undefined
    ) {
      recordingStore.getState().setRecording({
        recordingId: data.recordingId,
        egressId: data.egressId,
        state: data.state,
        startedAt: data.startedAt,
      });
    }

    eventBus.emit(SdkEventType.RECORDING_STARTED, {
      callId: data.callId,
      recordingId: data.recordingId,
      egressId: data.egressId,
      startedAt: data.startedAt,
      timestamp: Date.now(),
    });

    this.logger.debug("Recording state updated");
  }
}

