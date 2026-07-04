import { useParams, useSearchParams } from "react-router";
import AcceptInvite from "@/components/AcceptInvite";
import RedemptionPortal from "@/components/RedemptionPortal";
import Storefront from "@/components/Storefront";

/** Thin wrappers that read route params/search and inject them as props. */

export function RedeemRoute() {
  const { token } = useParams();
  return <RedemptionPortal token={token ?? ""} />;
}

export function ShopRoute() {
  const { id } = useParams();
  return <Storefront shopId={id ?? ""} />;
}

export function AcceptInviteRoute() {
  const [params] = useSearchParams();
  return <AcceptInvite token={params.get("token") ?? ""} />;
}
