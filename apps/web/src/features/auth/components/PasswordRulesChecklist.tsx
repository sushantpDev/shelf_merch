export type PasswordRuleKey =
  | "minLength"
  | "upper"
  | "lower"
  | "number"
  | "special"
  | "notCurrent"
  | "match";

export type PasswordRules = Record<PasswordRuleKey, boolean>;

export function evaluatePasswordRules(
  password: string,
  confirm: string,
  opts: { treatAsDifferentFromCurrent?: boolean } = {},
): PasswordRules {
  return {
    minLength: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    notCurrent: password.length > 0 && opts.treatAsDifferentFromCurrent !== false,
    match: password.length > 0 && password === confirm,
  };
}

export function allPasswordRulesPass(rules: PasswordRules): boolean {
  return Object.values(rules).every(Boolean);
}

const LABELS: { key: PasswordRuleKey; label: string }[] = [
  { key: "minLength", label: "Minimum 8 characters" },
  { key: "upper", label: "One uppercase letter" },
  { key: "lower", label: "One lowercase letter" },
  { key: "number", label: "One number" },
  { key: "special", label: "One special character" },
  { key: "notCurrent", label: "Password must not match current password" },
  { key: "match", label: "Passwords must match" },
];

/** Shows only unmet password rules — hidden when nothing to fix or fields are empty. */
export function PasswordRulesChecklist({
  rules,
  password,
  confirm,
}: {
  rules: PasswordRules;
  password: string;
  confirm: string;
}) {
  if (!password && !confirm) return null;

  const missing = LABELS.filter(({ key }) => {
    if (rules[key]) return false;
    // Don't nag about confirm-match until they've typed in confirm (or password).
    if (key === "match" && !confirm) return false;
    // Don't show "not current" until server said it was reused, or after they've typed.
    if (key === "notCurrent" && !password) return false;
    return true;
  });

  if (!missing.length) return null;

  return (
    <ul className="auth-pw-missing" aria-live="polite">
      {missing.map(({ key, label }) => (
        <li key={key} className="auth-pw-missing-item">
          {label}
        </li>
      ))}
    </ul>
  );
}
