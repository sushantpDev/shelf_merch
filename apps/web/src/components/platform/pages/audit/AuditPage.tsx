import { useAuditController } from "./controllers/useAuditController";
import { AuditView } from "./views/AuditView";

export function AuditPage() {
  const vm = useAuditController();
  return <AuditView {...vm} />;
}
