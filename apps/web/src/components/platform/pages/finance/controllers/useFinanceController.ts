import { useState } from "react";
import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import {
  type FundingRow,
  type PlatformInvoice,
  useCreditNotes,
  useFinanceOutstanding,
  useFundingApprovals,
  useTaxInvoices,
} from "../model";

export type FinanceVm = {
  outstanding: ReturnType<typeof useFinanceOutstanding>;
  funding: ReturnType<typeof useFundingApprovals>;
  invoices: ReturnType<typeof useTaxInvoices>;
  creditNotes: ReturnType<typeof useCreditNotes>;
  canWrite: boolean;
  acting: { row: FundingRow; mode: "approve" | "reject" } | null;
  issuingAgainst: PlatformInvoice | null;
  onApprove: (row: FundingRow) => void;
  onReject: (row: FundingRow) => void;
  onCloseAction: () => void;
  onFundingChanged: () => void;
  onIssueCreditNote: (invoice: PlatformInvoice) => void;
  onCloseCreditNote: () => void;
  onCreditNoteIssued: () => void;
};

/** Controller for the platform finance page. */
export function useFinanceController(): FinanceVm {
  const [reloadKey, setReloadKey] = useState(0);
  const [docsReloadKey, setDocsReloadKey] = useState(0);
  const [acting, setActing] = useState<{ row: FundingRow; mode: "approve" | "reject" } | null>(
    null,
  );
  const [issuingAgainst, setIssuingAgainst] = useState<PlatformInvoice | null>(null);
  const outstanding = useFinanceOutstanding();
  const funding = useFundingApprovals(reloadKey);
  const invoices = useTaxInvoices(docsReloadKey);
  const creditNotes = useCreditNotes(docsReloadKey);
  const canWrite = canAccessArea(getStoredUser()?.role, "finance", "write");

  return {
    outstanding,
    funding,
    invoices,
    creditNotes,
    canWrite,
    acting,
    issuingAgainst,
    onApprove: (row) => setActing({ row, mode: "approve" }),
    onReject: (row) => setActing({ row, mode: "reject" }),
    onCloseAction: () => setActing(null),
    onFundingChanged: () => {
      setActing(null);
      setReloadKey((k) => k + 1);
    },
    onIssueCreditNote: (invoice) => setIssuingAgainst(invoice),
    onCloseCreditNote: () => setIssuingAgainst(null),
    onCreditNoteIssued: () => {
      setIssuingAgainst(null);
      setDocsReloadKey((k) => k + 1);
    },
  };
}
