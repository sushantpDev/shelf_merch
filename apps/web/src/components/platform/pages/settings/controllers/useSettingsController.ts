import { useState } from "react";
import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import { usePlatformSettings } from "../model";

export type SettingsVm = ReturnType<typeof usePlatformSettings> & {
  canWrite: boolean;
  editing: { key: string; value: unknown } | null;
  onEdit: (key: string, value: unknown) => void;
  onCloseEdit: () => void;
  onSettingSaved: () => void;
};

/** Controller for the platform settings page. */
export function useSettingsController(): SettingsVm {
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<{ key: string; value: unknown } | null>(null);
  const load = usePlatformSettings(reloadKey);
  const canWrite = canAccessArea(getStoredUser()?.role, "settings", "write");

  return {
    ...load,
    canWrite,
    editing,
    onEdit: (key, value) => setEditing({ key, value }),
    onCloseEdit: () => setEditing(null),
    onSettingSaved: () => {
      setEditing(null);
      setReloadKey((k) => k + 1);
    },
  };
}
