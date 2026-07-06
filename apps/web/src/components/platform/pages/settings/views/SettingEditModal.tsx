import { useSettingEditController } from "../controllers/useSettingEditController";
import { SettingEditModalView } from "./SettingEditModalView";

/** Thin binding for the setting edit modal widget. */
export function SettingEditModal({
  settingKey,
  initial,
  onClose,
  onDone,
}: {
  settingKey: string;
  initial: unknown;
  onClose: () => void;
  onDone: () => void;
}) {
  const vm = useSettingEditController(settingKey, initial, onClose, onDone);
  return <SettingEditModalView {...vm} />;
}
