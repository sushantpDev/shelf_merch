import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { syncOrgWizard } from "@/services/api-bridge";
import {
  createWalletOnlyApi,
  fundWalletApi,
  createRazorpayOrderApi,
  uploadWalletFundingDocumentApi,
  fetchWalletTransactionsApi,
} from "@/services/mutations-api";
import { useInvalidateWorkspace } from "@/hooks/useWorkspace";
import { departmentsForSync, type WizardState } from "./types";

// Ui types re-exported here so views/controllers never import services/ directly.
export type { UiWallet } from "@/services/mappers";

/**
 * Persist the allocate-funds wizard. Updates departments, allocations, and manager invites.
 */
export function useSyncOrgWizard() {
  const invalidateWorkspace = useInvalidateWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (state: WizardState) =>
      syncOrgWizard({
        wallet: state.wallet,
        departments: departmentsForSync(state.departments),
      }),
    onSuccess: (_data, state) => {
      invalidateWorkspace();
      const walletId = state.wallet.id;
      if (walletId) {
        queryClient.invalidateQueries({ queryKey: ["wallet-transactions", walletId] });
      }
    },
  });
}

/** Create wallet only (step 1) — PO upload + finance approval request. */
export function useCreateWallet() {
  const invalidateWorkspace = useInvalidateWorkspace();
  return useMutation({
    mutationFn: (state: WizardState) => createWalletOnlyApi({ wallet: state.wallet }),
    onSuccess: () => invalidateWorkspace(),
  });
}

export function useFundWallet() {
  const invalidateWorkspace = useInvalidateWorkspace();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      walletId: string;
      amount: number;
      description?: string;
      fundingMethod?: "po_upload" | "online";
      docType?: string;
      docNumber?: string;
      uploadFile?: File;
    }) =>
      (async () => {
        const result = await fundWalletApi(payload.walletId, {
          amount: payload.amount,
          description: payload.description,
          fundingMethod: payload.fundingMethod,
          docType: payload.docType,
          docNumber: payload.docNumber,
        });
        if (payload.uploadFile) {
          await uploadWalletFundingDocumentApi(payload.walletId, payload.uploadFile);
        }
        return result;
      })(),
    onSuccess: (_data, variables) => {
      invalidateWorkspace();
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions", variables.walletId] });
    },
  });
}

export function useCreateRazorpayOrder() {
  return useMutation({
    mutationFn: (payload: { walletId: string; amount: number }) =>
      createRazorpayOrderApi(payload.walletId, payload.amount),
  });
}

export function useWalletTransactions(walletId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ["wallet-transactions", walletId, limit],
    queryFn: () => fetchWalletTransactionsApi(walletId!, limit),
    enabled: Boolean(walletId),
  });
}
