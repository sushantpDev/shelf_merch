import { createFileRoute, redirect } from "@tanstack/react-router";
import { getStoredUser, isAuthenticated, isPlatformUser } from "@/services/api-bridge";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" });
    if (isPlatformUser(getStoredUser())) throw redirect({ to: "/platform/dashboard" });
    throw redirect({ to: "/app/orders" });
  },
});
