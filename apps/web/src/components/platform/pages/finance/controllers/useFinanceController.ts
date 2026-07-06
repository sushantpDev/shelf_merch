import { useState } from "react";
import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import { type FundingRow, useFinanceOutstanding, useFundingApprovals } from "../model";

export type FinanceVm = {
  outstanding: ReturnType<typeof useFinanceOutstanding>;
  funding: ReturnType<typeof useFundingApprovals>;
  canWrite: boolean;
  acting: { row: FundingRow; mode: "approve" | "reject" } | null;
  onApprove: (row: FundingRow) => void;
  onReject: (row: FundingRow) => void;
  onCloseAction: () => void;
  onFundingChanged: () => void;
};

/** Controller for the platform finance page. */
export function useFinanceController(): FinanceVm {
  const [reloadKey, setReloadKey] = useState(0);
  const [acting, setActing] = useState<{ row: FundingRow; mode: "approve" | "reject" } | null>(
    null,
  );
  const outstanding = useFinanceOutstanding();
  const funding = useFundingApprovals(reloadKey);
  const canWrite = canAccessArea(getStoredUser()?.role, "finance", "write");

  return {
    outstanding,
    funding,
    canWrite,
    acting,
    onApprove: (row) => setActing({ row, mode: "approve" }),
    onReject: (row) => setActing({ row, mode: "reject" }),
    onCloseAction: () => setActing(null),
    onFundingChanged: () => {
      setActing(null);
      setReloadKey((k) => k + 1);
    },
  };
}
