import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";

export const SUPPORT_TICKET_TYPES = [
  "delivery_issue",
  "address_change",
  "replacement",
  "redemption_issue",
  "billing",
  "other",
] as const;

export type SupportTicketType = (typeof SUPPORT_TICKET_TYPES)[number];

export const TYPE_LABELS: Record<string, string> = {
  delivery_issue: "Delivery issue",
  address_change: "Address change",
  replacement: "Replacement",
  redemption_issue: "Redemption issue",
  billing: "Billing",
  other: "Other",
};

export type SupportMessage = {
  _id?: string;
  authorUserId?: string | null;
  authorName?: string;
  fromPlatform?: boolean;
  body: string;
  at: string;
};

export type SupportAttachment = {
  _id?: string;
  url: string;
  name?: string;
  contentType?: string;
  size?: number;
};

export type SupportTicket = {
  _id: string;
  subject: string;
  description: string;
  type: string;
  status: string;
  messages: SupportMessage[];
  attachments?: SupportAttachment[];
  createdAt: string;
  updatedAt: string;
};

type Paginated<T> = { items: T[]; pagination?: { total?: number } };

export const SUPPORT_QUERY_KEY = ["support-tickets"] as const;

/** The workspace's own tickets — separate cache slice, not the workspace snapshot. */
export function useMyTickets() {
  return useQuery({
    queryKey: SUPPORT_QUERY_KEY,
    queryFn: () => apiFetch<Paginated<SupportTicket>>("/support-tickets?limit=100"),
    staleTime: 15_000,
  });
}

export function useTicket(id: string | null) {
  return useQuery({
    queryKey: [...SUPPORT_QUERY_KEY, id],
    queryFn: () => apiFetch<SupportTicket>(`/support-tickets/${id}`),
    enabled: id !== null,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      subject: string;
      description: string;
      type: SupportTicketType;
      file?: File | null;
    }) => {
      if (payload.file) {
        const form = new FormData();
        form.append("subject", payload.subject);
        form.append("description", payload.description);
        form.append("type", payload.type);
        form.append("attachment", payload.file);
        return apiFetch<SupportTicket>("/support-tickets", { method: "POST", body: form });
      }
      return apiFetch<SupportTicket>("/support-tickets", {
        method: "POST",
        body: JSON.stringify({
          subject: payload.subject,
          description: payload.description,
          type: payload.type,
        }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SUPPORT_QUERY_KEY }),
  });
}

export function useReplyTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, body }: { ticketId: string; body: string }) =>
      apiFetch<SupportTicket>(`/support-tickets/${ticketId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUPPORT_QUERY_KEY }),
  });
}

/** Customer confirms a resolved ticket solved their issue — closes it. */
export function useConfirmTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) =>
      apiFetch<SupportTicket>(`/support-tickets/${ticketId}/confirm`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUPPORT_QUERY_KEY }),
  });
}
