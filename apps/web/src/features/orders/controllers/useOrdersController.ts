import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { UiOrder } from "../model";

export type OrdersVm = {
  isLoading: boolean;
  errorMessage: string | null;
  hasOrders: boolean;
  query: string;
  filtered: UiOrder[];
  selected: UiOrder | null;
  onQuery: (query: string) => void;
  onSelect: (order: UiOrder) => void;
  onDialogOpenChange: (open: boolean) => void;
  onDownloadInvoice: () => void;
  onTrackShipment: () => void;
};

/** Controller for the orders screen: workspace slice, search filter, detail dialog. */
export function useOrdersController(): OrdersVm {
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UiOrder | null>(null);

  const filtered = useMemo(() => {
    const list = workspace?.orders ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (o) => o.name.toLowerCase().includes(q) || o.orderNumber.toLowerCase().includes(q),
    );
  }, [workspace?.orders, query]);

  return {
    isLoading: isLoading && !workspace,
    errorMessage:
      isError || !workspace
        ? error instanceof Error
          ? error.message
          : "Could not load orders"
        : null,
    hasOrders: (workspace?.orders ?? []).length > 0,
    query,
    filtered,
    selected,
    onQuery: setQuery,
    onSelect: setSelected,
    onDialogOpenChange: (open) => {
      if (!open) setSelected(null);
    },
    onDownloadInvoice: () => toast.success("Invoice downloaded"),
    onTrackShipment: () => toast("Opening carrier tracking…"),
  };
}
