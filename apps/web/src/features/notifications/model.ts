import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type ListNotificationsParams,
} from "@/services/notifications-api";

export type { AppNotification };
export { resolveNotificationLink } from "@/services/notifications-api";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

export function formatNotificationTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function useRecentNotifications(params: ListNotificationsParams = {}, enabled = true) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "recent", page, limit] as const,
    queryFn: () => listNotifications({ page, limit }),
    staleTime: 15_000,
    refetchInterval: 60_000,
    enabled,
  });
}

/** Unread badge count — uses pagination.total so it stays accurate past the page size. */
export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "unread-count"] as const,
    queryFn: async () => {
      const res = await listNotifications({ unread: true, page: 1, limit: 1 });
      return res.pagination.total;
    },
    staleTime: 15_000,
    refetchInterval: 60_000,
    enabled,
  });
}

export function useUnreadNotifications(enabled = true) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "unread"] as const,
    queryFn: () => listNotifications({ unread: true, page: 1, limit: 50 }),
    staleTime: 15_000,
    enabled,
  });
}

function invalidateNotifications(qc: ReturnType<typeof useQueryClient>) {
  return qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => invalidateNotifications(qc),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => invalidateNotifications(qc),
  });
}
