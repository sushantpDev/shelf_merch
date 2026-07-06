import { useState } from "react";
import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import { type TeamRow, usePlatformTeam } from "../model";

export type TeamVm = ReturnType<typeof usePlatformTeam> & {
  canWrite: boolean;
  managing: TeamRow | null;
  inviting: boolean;
  onManage: (row: TeamRow) => void;
  onCloseManage: () => void;
  onOpenInvite: () => void;
  onCloseInvite: () => void;
  onReload: () => void;
  onInviteDone: () => void;
};

/** Controller for the platform team page. */
export function useTeamController(): TeamVm {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<TeamRow | null>(null);
  const [inviting, setInviting] = useState(false);
  const load = usePlatformTeam(reloadKey);
  const canWrite = canAccessArea(getStoredUser()?.role, "team", "write");

  const reload = () => setReloadKey((k) => k + 1);

  return {
    ...load,
    canWrite,
    managing,
    inviting,
    onManage: setManaging,
    onCloseManage: () => setManaging(null),
    onOpenInvite: () => setInviting(true),
    onCloseInvite: () => setInviting(false),
    onReload: reload,
    onInviteDone: () => {
      setInviting(false);
      reload();
    },
  };
}
