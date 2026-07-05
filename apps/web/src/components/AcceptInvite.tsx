import { useAcceptInviteController } from "./public/controllers/useAcceptInviteController";
import { AcceptInviteView } from "./public/views/AcceptInviteView";
import "@/styles/shelf-merch.css";

export default function AcceptInvite({ token: searchToken }: { token: string }) {
  const vm = useAcceptInviteController(searchToken);
  return <AcceptInviteView {...vm} />;
}
