import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ApprovalStatus = "pending" | "approved" | "rejected" | "" | string;
type BudgetStatus = "active" | "draft" | string | undefined;

type Props = {
  approvalStatus?: ApprovalStatus;
  budgetStatus?: BudgetStatus;
  className?: string;
};

export function BudgetStatusBadge({ approvalStatus, budgetStatus, className }: Props) {
  if (approvalStatus === "pending") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
          className,
        )}
      >
        Pending approval
      </Badge>
    );
  }

  if (approvalStatus === "rejected") {
    return (
      <Badge variant="destructive" className={className}>
        Rejected
      </Badge>
    );
  }

  if (budgetStatus === "active" || approvalStatus === "approved") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
          className,
        )}
      >
        Approved
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={className}>
      Setup in progress
    </Badge>
  );
}
