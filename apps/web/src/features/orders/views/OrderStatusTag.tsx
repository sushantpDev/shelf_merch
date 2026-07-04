const STATUS_CLASS: Record<string, string> = {
  Processing: "tag-proc",
  Shipped: "tag-ship",
  Delivered: "tag-deliv",
};

/** Colored status pill matching the legacy `statusTag()` mapping. */
export function OrderStatusTag({ status }: { status: string }) {
  return <span className={`tag ${STATUS_CLASS[status] || "tag-proc"}`}>{status}</span>;
}
