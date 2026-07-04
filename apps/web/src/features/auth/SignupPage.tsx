import { useSignupController } from "./controllers/useSignupController";
import { SignupView } from "./views/SignupView";

export function SignupPage() {
  const vm = useSignupController();
  return <SignupView {...vm} />;
}
