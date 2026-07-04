import { useBillingController } from "./controllers/useBillingController";
import { BillingView } from "./views/BillingView";

export function BillingPage() {
  const vm = useBillingController();
  return <BillingView {...vm} />;
}
