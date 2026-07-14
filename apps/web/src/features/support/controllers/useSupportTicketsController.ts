import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateTicket,
  useMyTickets,
  useReplyTicket,
  useTicket,
  type SupportTicket,
  type SupportTicketType,
} from "../model";

export type SupportTicketsVm = {
  isLoading: boolean;
  errorMessage: string | null;
  tickets: SupportTicket[];
  // New-ticket dialog
  creating: boolean;
  subject: string;
  type: SupportTicketType;
  description: string;
  submitting: boolean;
  onOpenCreate: () => void;
  onCreateOpenChange: (open: boolean) => void;
  onSubject: (v: string) => void;
  onType: (v: SupportTicketType) => void;
  onDescription: (v: string) => void;
  onSubmit: () => void;
  // Detail dialog
  selected: SupportTicket | null;
  detailLoading: boolean;
  reply: string;
  replying: boolean;
  canReply: boolean;
  onSelect: (ticket: SupportTicket) => void;
  onDetailOpenChange: (open: boolean) => void;
  onReply: (v: string) => void;
  onSendReply: () => void;
};

/** Controller for the tenant help center: my tickets, raise, thread + reply. */
export function useSupportTicketsController(): SupportTicketsVm {
  const list = useMyTickets();
  const createTicket = useCreateTicket();
  const replyTicket = useReplyTicket();

  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [type, setType] = useState<SupportTicketType>("other");
  const [description, setDescription] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detail = useTicket(selectedId);
  const selected =
    detail.data ?? list.data?.items.find((t) => t._id === selectedId) ?? null;

  const [reply, setReply] = useState("");

  async function onSubmit() {
    if (!subject.trim()) {
      toast.error("Add a short subject for your issue");
      return;
    }
    try {
      await createTicket.mutateAsync({
        subject: subject.trim(),
        description: description.trim(),
        type,
      });
      setCreating(false);
      setSubject("");
      setDescription("");
      setType("other");
      toast.success("Ticket raised — our team will get back to you");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not raise the ticket");
    }
  }

  async function onSendReply() {
    if (!selectedId || !reply.trim()) return;
    try {
      await replyTicket.mutateAsync({ ticketId: selectedId, body: reply.trim() });
      setReply("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the reply");
    }
  }

  return {
    isLoading: list.isLoading && !list.data,
    errorMessage: list.isError
      ? list.error instanceof Error
        ? list.error.message
        : "Could not load tickets"
      : null,
    tickets: list.data?.items ?? [],
    creating,
    subject,
    type,
    description,
    submitting: createTicket.isPending,
    onOpenCreate: () => setCreating(true),
    onCreateOpenChange: setCreating,
    onSubject: setSubject,
    onType: setType,
    onDescription: setDescription,
    onSubmit,
    selected: selectedId ? selected : null,
    detailLoading: detail.isLoading,
    reply,
    replying: replyTicket.isPending,
    canReply: selected !== null && selected.status !== "closed",
    onSelect: (t) => setSelectedId(t._id),
    onDetailOpenChange: (open) => {
      if (!open) {
        setSelectedId(null);
        setReply("");
      }
    },
    onReply: setReply,
    onSendReply,
  };
}
