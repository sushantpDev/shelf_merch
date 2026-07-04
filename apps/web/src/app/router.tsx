import type { ComponentType } from "react";
import { createBrowserRouter, redirect, type RouteObject } from "react-router";
import { NotFound, RootLayout, RouteError } from "./RootLayout";
import { getStoredUser, isAuthenticated, isPlatformUser } from "@/services/api-bridge";
import { requireTenantArea } from "@/services/tenant-route-guards";

/** Lazy route: resolves a named (default) export to react-router's `{ Component }`. */
function page(loader: () => Promise<Record<string, unknown>>, name = "default") {
  return () => loader().then((m) => ({ Component: m[name] as ComponentType }));
}

/** Signed-in users never see landing/login — bounce them into their app. */
function redirectIfAuthed() {
  if (!isAuthenticated()) return null;
  if (isPlatformUser(getStoredUser())) return redirect("/platform/dashboard");
  return redirect("/app/orders");
}

const tenantChildren: RouteObject[] = [
  { index: true, lazy: page(() => import("@/features/home/HomePage"), "HomePage") },
  { path: "orders", lazy: page(() => import("@/features/orders/OrdersPage"), "OrdersPage") },
  { path: "wallets", lazy: page(() => import("@/features/wallets/WalletsPage"), "WalletsPage") },
  {
    path: "shops",
    children: [
      { index: true, lazy: page(() => import("@/features/shops/ShopsPage"), "ShopsPage") },
      {
        path: "new",
        loader: () => (requireTenantArea("shops", "write"), null),
        lazy: page(() => import("@/features/shops/CreateShopWizard"), "CreateShopWizard"),
      },
      {
        path: ":id",
        children: [
          {
            index: true,
            lazy: page(() => import("@/features/shops/ShopDetailPage"), "ShopDetailPage"),
          },
          {
            path: "designs/:collectionId",
            lazy: page(
              () => import("@/features/shops/ShopDesignDetailPage"),
              "ShopDesignDetailPage",
            ),
          },
        ],
      },
    ],
  },
  {
    path: "swag",
    children: [
      { index: true, lazy: page(() => import("@/features/swag/SwagPage"), "SwagPage") },
      {
        path: "new",
        loader: () => (requireTenantArea("swag", "write"), null),
        lazy: page(() => import("@/features/swag/wizard/SwagWizard"), "SwagWizard"),
      },
    ],
  },
  {
    path: "kits",
    children: [
      { index: true, lazy: page(() => import("@/features/kits/KitsPage"), "KitsPage") },
      {
        path: "new",
        loader: () => (requireTenantArea("kits", "write"), null),
        lazy: page(() => import("@/features/kits/wizard/KitWizard"), "KitWizard"),
      },
      {
        path: ":id",
        children: [
          {
            index: true,
            lazy: page(() => import("@/features/kits/KitDetailPage"), "KitDetailPage"),
          },
          {
            path: "edit",
            loader: () => (requireTenantArea("kits", "write"), null),
            lazy: page(() => import("@/features/kits/wizard/EditKitWizard"), "EditKitWizard"),
          },
          {
            path: "send",
            loader: () => (requireTenantArea("campaignOps", "write"), null),
            lazy: page(() => import("@/features/kits/send/SendKitWizard"), "SendKitWizard"),
          },
        ],
      },
    ],
  },
  {
    path: "campaigns",
    children: [
      {
        index: true,
        lazy: page(() => import("@/features/campaigns/CampaignsPage"), "CampaignsPage"),
      },
      {
        path: "send-points",
        loader: () => (requireTenantArea("campaignOps", "write"), null),
        lazy: page(
          () => import("@/features/campaigns/send-points/SendPointsWizard"),
          "SendPointsWizard",
        ),
      },
    ],
  },
  {
    path: "contacts",
    lazy: page(() => import("@/features/contacts/ContactsPage"), "ContactsPage"),
  },
  {
    path: "integrations",
    lazy: page(() => import("@/features/integrations/IntegrationsPage"), "IntegrationsPage"),
  },
  {
    path: "settings",
    lazy: page(() => import("@/features/settings/SettingsPage"), "SettingsPage"),
  },
  { path: "billing", lazy: page(() => import("@/features/billing/BillingPage"), "BillingPage") },
  {
    path: "catalog",
    children: [
      { index: true, lazy: page(() => import("@/features/catalog/CatalogPage"), "CatalogPage") },
      {
        path: ":id",
        lazy: page(() => import("@/features/catalog/CatalogProductPage"), "CatalogProductPage"),
      },
    ],
  },
];

const platformPages = () => import("@/components/platform/PlatformPages");

const platformChildren: RouteObject[] = [
  { index: true, loader: () => redirect("/platform/dashboard") },
  { path: "dashboard", lazy: page(platformPages, "DashboardPage") },
  {
    path: "catalog",
    children: [
      { index: true, lazy: page(platformPages, "CatalogPage") },
      {
        path: "new",
        lazy: page(() => import("@/components/platform/ProductWizard"), "ProductWizard"),
      },
      {
        path: "import",
        lazy: page(() => import("@/components/platform/ShopifyImport"), "ShopifyImport"),
      },
      {
        path: ":id",
        lazy: page(() => import("@/components/platform/ProductWizard"), "ProductWizard"),
      },
    ],
  },
  {
    path: "kits",
    children: [
      { index: true, lazy: page(platformPages, "KitsPage") },
      { path: "new", lazy: page(() => import("@/components/platform/KitWizard"), "KitWizard") },
      {
        path: "import",
        lazy: page(() => import("@/components/platform/ShopifyImport"), "ShopifyImport"),
      },
      { path: ":id", lazy: page(() => import("@/components/platform/KitWizard"), "KitWizard") },
    ],
  },
  {
    path: "orders",
    children: [
      { index: true, lazy: page(platformPages, "OrdersPage") },
      { path: ":id", lazy: page(platformPages, "OrderFulfillmentPage") },
    ],
  },
  { path: "tenants", lazy: page(platformPages, "TenantsPage") },
  { path: "finance", lazy: page(platformPages, "FinancePage") },
  { path: "inventory", lazy: page(platformPages, "InventoryPage") },
  { path: "production", lazy: page(platformPages, "ProductionPage") },
  { path: "shipments", lazy: page(platformPages, "ShipmentsPage") },
  { path: "support", lazy: page(platformPages, "SupportPage") },
  { path: "team", lazy: page(platformPages, "TeamPage") },
  { path: "audit", lazy: page(platformPages, "AuditPage") },
  { path: "settings", lazy: page(platformPages, "SettingsPage") },
];

export const appRouter = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        loader: redirectIfAuthed,
        lazy: page(() => import("@/components/LandingPage")),
      },
      {
        path: "login",
        loader: redirectIfAuthed,
        lazy: page(() => import("@/features/auth/LoginPage"), "LoginPage"),
      },
      { path: "signup", lazy: page(() => import("@/features/auth/SignupPage"), "SignupPage") },
      {
        path: "accept-invite",
        lazy: page(() => import("./publicRoutes"), "AcceptInviteRoute"),
      },
      { path: "shop/:id", lazy: page(() => import("./publicRoutes"), "ShopRoute") },
      { path: "redeem/:token", lazy: page(() => import("./publicRoutes"), "RedeemRoute") },
      {
        path: "app",
        lazy: page(() => import("@/components/tenant/TenantLayout")),
        children: tenantChildren,
      },
      {
        path: "platform",
        lazy: page(() => import("@/components/platform/PlatformLayout")),
        children: platformChildren,
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
