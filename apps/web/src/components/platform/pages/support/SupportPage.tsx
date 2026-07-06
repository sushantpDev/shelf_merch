import { useSupportController } from "./controllers/useSupportController";
import { SupportView } from "./views/SupportView";

export function SupportPage() {
  const vm = useSupportController();
  return <SupportView {...vm} />;
}
