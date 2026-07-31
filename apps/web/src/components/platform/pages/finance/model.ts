import {
  createCreditNote,
  fetchCreditNotes,
  fetchFinanceOutstanding,
  fetchFundingApprovals,
  fetchPlatformInvoices,
  type PlatformCreditNote,
  type PlatformInvoice,
} from "@/services/platform-api";
import { useLoad } from "../../useLoad";

export { approveFunding, rejectFunding, createCreditNote } from "@/services/platform-api";
export type { PlatformCreditNote, PlatformInvoice };

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

/** Tax invoices available for credit notes. */
export function useTaxInvoices(reloadKey: number) {
  return useLoad(
    async () => {
      const res = await fetchPlatformInvoices({ type: "tax", limit: 50 });
      return res.items;
    },
    [reloadKey],
  );
}

/** Issued credit notes. */
export function useCreditNotes(reloadKey: number) {
  return useLoad(
    async () => {
      const res = await fetchCreditNotes({ limit: 50 });
      return res.items;
    },
    [reloadKey],
  );
}
