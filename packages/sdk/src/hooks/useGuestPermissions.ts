import type { ParticipantPermissions } from "../state/types";

const GUEST_PERMISSIONS: ParticipantPermissions = {
  canMute: false,
  canKick: false,
  canTransfer: false,
  canEnd: false,
  canRecord: false,
  canShareScreen: true,
};

export function useGuestPermissions(): ParticipantPermissions {
  return GUEST_PERMISSIONS;
}
