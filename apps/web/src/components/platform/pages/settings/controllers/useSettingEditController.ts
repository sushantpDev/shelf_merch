import { useState } from "react";
import { updateSetting } from "../model";

export type SettingEditVm = {
  settingKey: string;
  text: string;
  busy: boolean;
  err: string;
  onClose: () => void;
  onText: (text: string) => void;
  onSubmit: () => void;
};

/** Controller for the setting edit modal. */
export function useSettingEditController(
  settingKey: string,
  initial: unknown,
  onClose: () => void,
  onDone: () => void,
): SettingEditVm {
  const [text, setText] = useState(JSON.stringify(initial, null, 2));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      value = text;
    }
    try {
      await updateSetting(settingKey, value);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save setting");
      setBusy(false);
    }
  }

  return {
    settingKey,
    text,
    busy,
    err,
    onClose,
    onText: setText,
    onSubmit: submit,
  };
}
