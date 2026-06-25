import { createFileRoute, redirect } from "@tanstack/react-router";

// The landing equals today's post-login view (Orders). Until Orders is migrated
// it falls back to the legacy engine; Settings is the first React page.
export const Route = createFileRoute("/app/")({
  beforeLoad: () => {
    throw redirect({ to: "/app/settings" });
  },
});
