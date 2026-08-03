import { shopSlugFromHostname } from "@/lib/shopRedeemUrl";
import Storefront from "@/components/Storefront";
import { Outlet } from "react-router";

/** When visiting salesforce.store, render the public storefront (not redeem entry). */
export function ShopSubdomainGate() {
  const slug = shopSlugFromHostname();
  if (slug) {
    return <Storefront slug={slug} />;
  }
  return <Outlet />;
}
