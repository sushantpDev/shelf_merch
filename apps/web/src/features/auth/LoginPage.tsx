import { useLoginController } from "./controllers/useLoginController";
import { LoginView } from "./views/LoginView";

export function LoginPage() {
  const vm = useLoginController();
  return <LoginView {...vm} />;
}
