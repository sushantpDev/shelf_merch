import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { Link, Outlet, useRouteError, useRevalidator } from "react-router";
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

  return (
    <StatusPageShell
      icon={<AlertTriangle size={32} strokeWidth={1.75} aria-hidden />}
      title="This page didn't load"
      description="Something went wrong on our end. Try again, or head back to the homepage."
      actions={
        <>
          <button
            type="button"
            className="btn btn-brand"
            onClick={() => revalidator.revalidate()}
          >
            Try again
          </button>
          <Link to="/" className="btn btn-ghost">
            Go home
          </Link>
        </>
      }
    />
  );
}
