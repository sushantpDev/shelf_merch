import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

type Props = {
  value: string;
  onChange: (digits: string) => void;
  disabled?: boolean;
  length?: number;
  idPrefix?: string;
};

/** Six-box numeric OTP input with autofocus, arrow/backspace move, and paste. */
export function OtpInput({
  value,
  onChange,
  disabled = false,
  length = 6,
  idPrefix = "otp",
}: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function setDigit(index: number, char: string) {
    const next = digits.map((d, i) => (i === index ? char : d === " " ? "" : d));
    const joined = next.join("").replace(/\D/g, "").slice(0, length);
    onChange(joined);
  }

  function handleChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      setDigit(index, "");
      return;
    }
    if (cleaned.length > 1) {
      // Multi-char typed/pasted into one box
      const merged = (value.slice(0, index) + cleaned).replace(/\D/g, "").slice(0, length);
      onChange(merged);
      const focusAt = Math.min(merged.length, length - 1);
      refs.current[focusAt]?.focus();
      return;
    }
    setDigit(index, cleaned);
    if (index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index] && digits[index] !== " ") {
        setDigit(index, "");
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        setDigit(index - 1, "");
      }
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
      e.preventDefault();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
      e.preventDefault();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div className="auth-otp-row" role="group" aria-label="Verification code">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          id={`${idPrefix}-${i}`}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          className="auth-otp-box"
          value={digits[i] === " " ? "" : digits[i]}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
