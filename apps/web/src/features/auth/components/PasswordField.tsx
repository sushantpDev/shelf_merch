import { useLayoutEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authInputClassName } from "../views/AuthLayout";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  autoComplete?: string;
};

/** Password input with visibility toggle that preserves caret position. */
export function PasswordField({
  id,
  value,
  onValueChange,
  autoComplete = "current-password",
  className,
  ...rest
}: Props) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<{ start: number; end: number } | null>(null);

  useLayoutEffect(() => {
    const el = inputRef.current;
    const caret = caretRef.current;
    if (!el || !caret) return;
    el.setSelectionRange(caret.start, caret.end);
    caretRef.current = null;
  }, [visible]);

  function toggleVisibility() {
    const el = inputRef.current;
    if (el) {
      caretRef.current = {
        start: el.selectionStart ?? value.length,
        end: el.selectionEnd ?? value.length,
      };
    }
    setVisible((v) => !v);
  }

  return (
    <div className="auth-simple-input-wrap">
      <input
        {...rest}
        ref={inputRef}
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={`${authInputClassName} auth-simple-input--toggle${className ? ` ${className}` : ""}`}
      />
      <button
        type="button"
        className="auth-simple-toggle"
        onClick={toggleVisibility}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
