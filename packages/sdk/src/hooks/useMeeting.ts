import { useMeetingActions } from "./useMeetingActions";
import { useMeetingState } from "./useMeetingState";

export function useMeeting() {
  const state = useMeetingState();
  const actions = useMeetingActions();

  return {
    ...state,
    ...actions,
  };
}
