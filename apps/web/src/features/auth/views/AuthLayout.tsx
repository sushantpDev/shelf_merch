import { Link } from "react-router";
import type { ReactNode } from "react";

const LOGO_SRC = "/images/logo/shelfmerch-logo-dark.svg";

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  footerLink?: { hint: string; label: string; to: "/login" | "/signup" };
};

export function AuthLayout({ children, title, subtitle, footerLink }: AuthLayoutProps) {
  return (
    <div className="auth-simple">
      <div className="auth-simple-body">
        <div className="auth-simple-card">
          <Link to="/login" className="auth-simple-logo" aria-label="Shelf Merch home">
            <img src={LOGO_SRC} alt="Shelf Merch" className="auth-simple-logo-img" />
          </Link>

          <h1 className="auth-simple-title">{title}</h1>
          {subtitle ? <p className="auth-simple-subtitle">{subtitle}</p> : null}

          {children}

          {footerLink ? (
            <p className="auth-simple-switch">
              {footerLink.hint}{" "}
              <Link to={footerLink.to} className="auth-simple-switch-link">
                {footerLink.label}
              </Link>
            </p>
          ) : null}
        </div>
      </div>

      <footer className="auth-simple-footer">
        <Link to="/login" className="auth-simple-footer-link">
          Terms of use
        </Link>
        <Link to="/login" className="auth-simple-footer-link">
          Privacy policy
        </Link>
      </footer>
    </div>
  );
}

export function AuthLabel({
  htmlFor,
  children,
  action,
}: {
  htmlFor?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="auth-simple-label-row">
      <label htmlFor={htmlFor} className="auth-simple-label">
        {children}
      </label>
      {action}
    </div>
  );
}

export const authInputClassName = "auth-simple-input";
