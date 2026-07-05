import { useRedemptionController } from "./public/controllers/useRedemptionController";
import { RedemptionPortalView } from "./public/views/RedemptionPortalView";
import "@/styles/shelf-merch.css";

export default function RedemptionPortal({ token }: { token: string }) {
  const vm = useRedemptionController(token);
  return <RedemptionPortalView {...vm} />;
}
