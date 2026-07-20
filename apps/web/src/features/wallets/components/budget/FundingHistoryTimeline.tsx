import { Clock, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { inr } from "@/components/platform/platform-ui";
import { useWalletTransactions } from "../../model";
import { BudgetStatusBadge } from "./BudgetStatusBadge";

function formatEventDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type FundingEvent = {
  id: string;
  kind: "initial" | "topup" | "pending";
  amount: number;
  status: "approved" | "pending";
  date?: string;
  label: string;
};

function buildFundingEvents(
  fundIns: Array<{ _id?: string; amount: number; createdAt?: string }>,
  pending?: { amount: number; approvalStatus?: string },
): FundingEvent[] {
  const chronological = [...fundIns].sort(
    (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
  );

  const events: FundingEvent[] = chronological.map((txn, index) => ({
    id: txn._id ?? `fund-${index}`,
    kind: index === 0 ? "initial" : "topup",
    amount: txn.amount,
    status: "approved",
    date: txn.createdAt,
    label: index === 0 ? "Initial funding" : "Top-up",
  }));

  if (pending?.approvalStatus === "pending" && pending.amount > 0) {
    events.unshift({
      id: "pending-funding",
      kind: "pending",
      amount: pending.amount,
      status: "pending",
      label: "Top-up",
    });
  }

  return events.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime();
  });
}

type Props = {
  walletId: string;
  pendingAmount?: number;
  approvalStatus?: string;
  className?: string;
};

export function FundingHistoryTimeline({
  walletId,
  pendingAmount,
  approvalStatus,
  className,
}: Props) {
  const { data: txns = [], isLoading } = useWalletTransactions(walletId, 50);
  const fundIns = txns.filter((t) => t.type === "fund_in");
  const events = buildFundingEvents(fundIns, {
    amount: pendingAmount ?? 0,
    approvalStatus,
  });

  return (
    <Card id="funding-history" className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <History size={18} className="text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-lg">Funding history</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          All funding events for your organization budget — not separate wallets.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-dashed px-6 py-10 text-center">
            <Clock size={24} className="mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
            <p className="font-medium">No funding events yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Submit a Purchase Order or Agreement to fund your organization budget.
            </p>
          </div>
        ) : (
          <ol className="relative space-y-0">
            {events.map((event, index) => (
              <li key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
                {index < events.length - 1 ? (
                  <span
                    className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-border"
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className={`relative z-10 mt-1.5 h-[22px] w-[22px] shrink-0 rounded-full border-2 ${
                    event.status === "pending"
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950"
                      : "border-primary bg-primary/10"
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1 rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold capitalize">{event.label}</p>
                      <p className="mt-1 text-xl font-semibold tabular-nums">{inr(event.amount)}</p>
                    </div>
                    <BudgetStatusBadge
                      approvalStatus={event.status === "pending" ? "pending" : "approved"}
                      budgetStatus={event.status === "approved" ? "active" : undefined}
                    />
                  </div>
                  {event.date ? (
                    <p className="mt-2 text-sm text-muted-foreground">{formatEventDate(event.date)}</p>
                  ) : event.status === "pending" ? (
                    <p className="mt-2 text-sm text-muted-foreground">Awaiting ShelfMerch approval</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
