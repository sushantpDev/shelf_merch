import { useCreateShopController } from "./controllers/useCreateShopController";
import { CreateShopView } from "./views/CreateShopView";

export function CreateShopWizard() {
  const vm = useCreateShopController();
  return <CreateShopView {...vm} />;
}
