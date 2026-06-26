import { createFileRoute, redirect } from "@tanstack/react-router";

// The landing equals today's post-login view (Orders), now migrated to React.
export const Route = createFileRoute("/app/")({
  beforeLoad: () => {
    throw redirect({ to: "/app/orders" });
  },
});
