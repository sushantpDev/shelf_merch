import { shopSlugFromHostname } from "@/lib/shopRedeemUrl";
import ShopRedeemEntry from "@/components/ShopRedeemEntry";
import { Outlet } from "react-router";

/** When visiting salesforce.store, render the shop entry instead of the main app. */
export function ShopSubdomainGate() {
  const slug = shopSlugFromHostname();
  if (slug) {
    return <ShopRedeemEntry slug={slug} />;
  }
  return <Outlet />;
}
