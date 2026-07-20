import { ArrowDownRight, ArrowUpRight, CircleDollarSign, PieChart, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { inr } from "@/components/platform/platform-ui";

export type BudgetMetricItem = {
  label: string;
  value: number;
  hint?: string;
  tone?: "default" | "brand" | "muted";
  icon?: "balance" | "allocated" | "available" | "spent";
};

const ICONS = {
  balance: CircleDollarSign,
  allocated: PieChart,
  available: Wallet,
  spent: ArrowDownRight,
} as const;

type Props = {
  metrics: BudgetMetricItem[];
  className?: string;
};

export function BudgetMetrics({ metrics, className }: Props) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {metrics.map((metric) => {
        const Icon = metric.icon ? ICONS[metric.icon] : ArrowUpRight;
        const valueColor =
          metric.tone === "brand"
            ? "text-primary"
            : metric.tone === "muted"
              ? "text-muted-foreground"
              : "text-foreground";

        return (
          <Card key={metric.label} className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className={cn("mt-2 text-2xl font-semibold tabular-nums tracking-tight", valueColor)}>
                    {inr(metric.value)}
                  </p>
                  {metric.hint ? (
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{metric.hint}</p>
                  ) : null}
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                  <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
