import { useEffect, useState } from "react";
import {
  addTicketMessage,
  assignTicket,
  fetchPlatformTeam,
  resendRedemptionLink,
  resendTicketTracking,
  setTicketStatus,
} from "../model";

export type SupportManageVm = {
  row: Record<string, unknown>;
  ticketId: string;
  status: string;
  team: { userId: string; name: string }[];
  assignee: string;
  reply: string;
  internal: boolean;
  busy: boolean;
  err: string;
  okNote: string;
  onClose: () => void;
  onStatus: (status: string) => void;
  onAssignee: (userId: string) => void;
  onReply: (reply: string) => void;
  onInternal: (internal: boolean) => void;
  onSaveStatus: () => void;
  onAssign: () => void;
  onSendReply: () => void;
  onResendRedemption: () => void;
  onResendTracking: () => void;
};

/** Controller for the support ticket manage modal. */
export function useSupportManageController(
  row: Record<string, unknown>,
  onClose: () => void,
  onChanged: () => void,
): SupportManageVm {
  const ticketId = String(row._id);
  const [status, setStatus] = useState(String(row.status ?? "open"));
  const [team, setTeam] = useState<{ userId: string; name: string }[]>([]);
  const [assignee, setAssignee] = useState("");
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okNote, setOkNote] = useState("");

  useEffect(() => {
    fetchPlatformTeam()
      .then((t) => setTeam(t.filter((m) => m.status === "active")))
      .catch(() => setTeam([]));
  }, []);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setErr("");
    setOkNote("");
    try {
      await fn();
      setOkNote(ok);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return {
    row,
    ticketId,
    status,
    team,
    assignee,
    reply,
    internal,
    busy,
    err,
    okNote,
    onClose,
    onStatus: setStatus,
    onAssignee: setAssignee,
    onReply: setReply,
    onInternal: setInternal,
    onSaveStatus: () => run(() => setTicketStatus(ticketId, status), "Status updated."),
    onAssign: () => run(() => assignTicket(ticketId, assignee), "Ticket assigned."),
    onSendReply: () =>
      run(async () => {
        await addTicketMessage(ticketId, reply.trim(), internal);
        setReply("");
      }, "Reply added."),
    onResendRedemption: () => run(() => resendRedemptionLink(ticketId), "Redemption link resent."),
    onResendTracking: () => run(() => resendTicketTracking(ticketId), "Tracking link resent."),
  };
}
