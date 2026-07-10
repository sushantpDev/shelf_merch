type GoogleButtonProps = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

export function GoogleButton({ label, disabled, onClick }: GoogleButtonProps) {
  return (
    <button
      type="button"
      className="auth-simple-google"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <img
        src="/images/logos/google-g.svg"
        alt=""
        width={18}
        height={18}
        className="auth-simple-google__icon"
        aria-hidden
      />
      <span>{label}</span>
    </button>
  );
}
