import { redirect } from "react-router";
import { getStoredUser, isAuthenticated, isPlatformUser } from "@/services/api-bridge";
import { canAccessTenantArea, type TenantArea } from "@/services/tenant-access";

export function requireTenantArea(area: TenantArea, action: "read" | "write" = "read") {
  if (!isAuthenticated()) {
    throw redirect("/login");
  }
  if (isPlatformUser(getStoredUser())) {
    throw redirect("/platform/dashboard");
  }
  const role = getStoredUser()?.role;
  if (!canAccessTenantArea(role, area, action)) {
    throw redirect("/app");
  }
}
