import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AlertTriangle, FileText, Headset, Home, RotateCcw } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { isRouteErrorResponse, Link, useRouteError, useRevalidator } from "react-router";
import { ChatWidget } from "@/components/ChatWidget";
import { Toaster } from "@/components/ui/sonner";
import { ShelfMerchLogo } from "@/components/brand/ShelfMerchLogo";
import { ShopSubdomainGate } from "./ShopSubdomainGate";

const queryClient = new QueryClient();

function StatusPageShell({
  icon,
  title,
  description,
  actions,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actions: ReactNode;
}) {
  return (
    <div className="auth-simple">
      <div className="auth-simple-body">
        <div className="auth-simple-card">
          <Link to="/" className="auth-simple-logo" aria-label="Shelf Merch home">
            <ShelfMerchLogo height={48} className="auth-simple-logo-img" />
          </Link>

          <div className="status-page-icon">{icon}</div>

          <h1 className="auth-simple-title status-page-title">{title}</h1>
          <p className="auth-simple-subtitle status-page-description">{description}</p>

          <div className="status-page-actions">{actions}</div>
        </div>
      </div>
    </div>
  );
}

/** Soft illustration: browser window, warning, traffic cone. */
function ErrorPageIllustration() {
  return (
    <svg
      className="error-page-illu"
      viewBox="0 0 280 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="140" cy="142" rx="88" ry="10" fill="#EDE4FF" />
      <rect x="48" y="28" width="150" height="100" rx="14" fill="#F4EEFF" stroke="#C4B5FD" strokeWidth="2" />
      <rect x="48" y="28" width="150" height="26" rx="14" fill="#DDD6FE" />
      <rect x="48" y="40" width="150" height="14" fill="#DDD6FE" />
      <circle cx="64" cy="41" r="4" fill="#A78BFA" />
      <circle cx="78" cy="41" r="4" fill="#C4B5FD" />
      <circle cx="92" cy="41" r="4" fill="#DDD6FE" stroke="#A78BFA" strokeWidth="1" />
      <circle cx="123" cy="88" r="22" fill="#fff" stroke="#A78BFA" strokeWidth="2" />
      <circle cx="115" cy="84" r="2.5" fill="#7C3AED" />
      <circle cx="131" cy="84" r="2.5" fill="#7C3AED" />
      <path d="M114 98c4 5 14 5 18 0" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M198 52l18 32H180l18-32z"
        fill="#EDE4FF"
        stroke="#8B5CF6"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="214" y="64" width="3.5" height="12" rx="1.5" fill="#8B5CF6" />
      <circle cx="215.75" cy="80" r="2.2" fill="#8B5CF6" />
      <path
        d="M216 108h28l-4 28H220l-4-28z"
        fill="#C4B5FD"
        stroke="#7C3AED"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M220 108v-8a6 6 0 0 1 12 0v8" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
      <rect x="226" y="118" width="8" height="10" rx="1.5" fill="#EDE4FF" stroke="#7C3AED" strokeWidth="1.5" />
      <path d="M230 100v-6M224 97l6-4 6 4" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function resolveErrorCode(error: unknown): string {
  if (isRouteErrorResponse(error)) return String(error.status || 500);
  if (error && typeof error === "object" && "status" in error) {
    const status = Number((error as { status?: number }).status);
    if (Number.isFinite(status) && status > 0) return String(status);
  }
  return "500";
}

/** App shell: provides react-query + renders the matched route tree. */
export function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ShopSubdomainGate />
      <ChatWidget />
      <Toaster />
    </QueryClientProvider>
  );
}

export function NotFound() {
  return (
    <StatusPageShell
      icon={<span className="status-page-code">404</span>}
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
      actions={
        <Link to="/" className="btn btn-brand">
          Go home
        </Link>
      }
    />
  );
}

export function RouteError() {
  const error = useRouteError();
  const revalidator = useRevalidator();
  console.error(error);

  const errorCode = resolveErrorCode(error);
  const requestId = useMemo(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID().slice(0, 18);
    }
    return `err-${Date.now().toString(36)}`;
  }, []);

  return (
    <div className="auth-simple error-page">
      <div className="auth-simple-body">
        <div className="error-page-card">
          <Link to="/" className="auth-simple-logo" aria-label="Shelf Merch home">
            <ShelfMerchLogo height={48} className="auth-simple-logo-img" />
          </Link>

          <ErrorPageIllustration />

          <h1 className="error-page-title">Oops! Something went wrong</h1>
          <p className="error-page-description">
            We couldn&apos;t load this page right now. This is usually temporary. Please try again
            in a few moments.
          </p>

          <div className="error-page-actions">
            <button
              type="button"
              className="btn btn-brand error-page-btn"
              onClick={() => revalidator.revalidate()}
            >
              <RotateCcw size={16} strokeWidth={2.2} aria-hidden />
              Try again
            </button>
            <Link to="/" className="btn btn-ghost error-page-btn">
              <Home size={16} strokeWidth={2.2} aria-hidden />
              Go to homepage
            </Link>
          </div>

          <div className="error-page-meta" role="group" aria-label="Error details">
            <div className="error-page-meta__item">
              <span className="error-page-meta__icon" aria-hidden>
                <AlertTriangle size={18} strokeWidth={2} />
              </span>
              <div>
                <div className="error-page-meta__label">Error Code</div>
                <div className="error-page-meta__value">{errorCode}</div>
              </div>
            </div>
            <div className="error-page-meta__item">
              <span className="error-page-meta__icon" aria-hidden>
                <FileText size={18} strokeWidth={2} />
              </span>
              <div>
                <div className="error-page-meta__label">Request ID</div>
                <div className="error-page-meta__value error-page-meta__value--mono">{requestId}</div>
              </div>
            </div>
            <div className="error-page-meta__item">
              <span className="error-page-meta__icon" aria-hidden>
                <Headset size={18} strokeWidth={2} />
              </span>
              <div>
                <div className="error-page-meta__label">Need help?</div>
                <Link to="/app/support" className="error-page-meta__link">
                  Contact Support →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
