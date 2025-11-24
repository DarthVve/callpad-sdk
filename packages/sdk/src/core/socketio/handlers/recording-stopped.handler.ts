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

    this.logger.info("Recording stopped", {
      callId: data.callId,
      recordingId: data.recordingId,
      egressId: data.egressId,
    });

    if (currentState.session?.id !== data.callId) {
      pushStaleEventError("call:recordingStopped", "callId mismatch", {
        eventCallId: data.callId,
        sessionCallId: currentState.session?.id,
      });
      this.logger.warn("Ignoring recording stopped event for different call", {
        callId: data.callId,
      });
      return;
    }

    // Update session state (for backward compatibility)
    this.updateStore((state) => {
      if (state.session && state.session.id === data.callId) {
        state.session.recording = null;
      }
    });

    // Clear shared recording store (available to all participants)
    recordingStore.getState().clear();

    eventBus.emit(SdkEventType.RECORDING_STOPPED, {
      callId: data.callId,
      recordingId: data.recordingId,
      egressId: data.egressId,
      timestamp: Date.now(),
    });

    this.logger.debug("Recording state cleared");
  }
}

