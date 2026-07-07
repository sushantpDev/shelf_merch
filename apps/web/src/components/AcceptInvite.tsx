import { useAcceptInviteController } from "./public/controllers/useAcceptInviteController";
import { AcceptInviteView } from "./public/views/AcceptInviteView";

export default function AcceptInvite({ token: searchToken }: { token: string }) {
  const vm = useAcceptInviteController(searchToken);
  return <AcceptInviteView {...vm} />;
}
