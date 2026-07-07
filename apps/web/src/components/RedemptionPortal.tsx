import { useRedemptionController } from "./public/controllers/useRedemptionController";
import { RedemptionPortalView } from "./public/views/RedemptionPortalView";

export default function RedemptionPortal({ token }: { token: string }) {
  const vm = useRedemptionController(token);
  return <RedemptionPortalView {...vm} />;
}
