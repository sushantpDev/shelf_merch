import { useSettingsController } from "./controllers/useSettingsController";
import { SettingsView } from "./views/SettingsView";

export function SettingsPage() {
  const vm = useSettingsController();
  return <SettingsView {...vm} />;
}
