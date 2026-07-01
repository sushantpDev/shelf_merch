import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/LoginPage";
import { getStoredUser, isAuthenticated, isPlatformUser } from "@/services/api-bridge";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (!isAuthenticated()) return;
    if (isPlatformUser(getStoredUser())) throw redirect({ to: "/platform/dashboard" });
    throw redirect({ to: "/app/orders" });
  },
  head: () => ({
    meta: [
      { title: "Log in to SwagStore" },
      {
        name: "description",
        content:
          "Corporate swag & gifting on autopilot. Design, manage and deliver branded merchandise your team will love.",
      },
    ],
  }),
  component: LoginPage,
});
