import { useSupportTicketsController } from "./controllers/useSupportTicketsController";
import { SupportTicketsView } from "./views/SupportTicketsView";

export function SupportPage() {
  const vm = useSupportTicketsController();
  return <SupportTicketsView {...vm} />;
}
