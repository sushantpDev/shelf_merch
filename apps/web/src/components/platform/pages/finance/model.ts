import { fetchFinanceOutstanding, fetchFundingApprovals } from "@/services/platform-api";
import { useLoad } from "../../useLoad";

export { approveFunding, rejectFunding } from "@/services/platform-api";

export type FundingRow = {
  walletId: string;
  walletName: string;
  tenantName: string;
  balance: number;
  requestedAmount?: number;
  fundingDocument?: {
    docType?: string;
    docNumber?: string;
    fileUrl?: string;
    approvalStatus?: string;
  };
};

/** Outstanding balances by tenant. */
export function useFinanceOutstanding() {
  return useLoad(() => fetchFinanceOutstanding(), []);
}

/** Pending wallet funding approvals; bump `reloadKey` to refetch after a mutation. */
export function useFundingApprovals(reloadKey: number) {
  return useLoad(() => fetchFundingApprovals(), [reloadKey]);
}
