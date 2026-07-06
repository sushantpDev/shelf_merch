import { useFinanceController } from "./controllers/useFinanceController";
import { FinanceView } from "./views/FinanceView";

export function FinancePage() {
  const vm = useFinanceController();
  return <FinanceView {...vm} />;
}
