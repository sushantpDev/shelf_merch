import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useInvalidateWorkspace } from "@/hooks/useWorkspace";
import { listTenantUsersApi, transferOwnershipApi } from "../model";
import type { TenantUser, WorkspaceOwner } from "../model";

export type TransferOwnershipProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentOwner: WorkspaceOwner;
};

export type TransferOwnershipVm = {
  open: boolean;
  currentOwner: WorkspaceOwner;
  loadingUsers: boolean;
  eligible: TenantUser[];
  selected: TenantUser | null;
  selectedId: string;
  confirming: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onConfirm: () => void;
  onInviteAdmin: () => void;
};

/** Controller for the transfer-ownership dialog: admin list, two-step confirm, transfer. */
export function useTransferOwnershipController({
  open,
  onOpenChange,
  currentOwner,
}: TransferOwnershipProps): TransferOwnershipVm {
  const invalidate = useInvalidateWorkspace();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  const eligible = useMemo(
    () =>
      users.filter(
        (u) => u.id !== currentOwner.id && u.role === "company_admin" && u.status === "active",
      ),
    [users, currentOwner.id],
  );

  const selected = eligible.find((u) => u.id === selectedId) ?? null;

  useEffect(() => {
    if (!open) {
      setSelectedId("");
      setConfirming(false);
      return;
    }
    setLoadingUsers(true);
    listTenantUsersApi()
      .then(setUsers)
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Could not load workspace users");
      })
      .finally(() => setLoadingUsers(false));
  }, [open]);

  async function onConfirm() {
    if (!selected) return;
    setPending(true);
    try {
      const owner = await transferOwnershipApi(selected.id);
      toast.success(`Ownership transferred to ${owner.name}`);
      invalidate();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not transfer ownership");
    } finally {
      setPending(false);
    }
  }

  return {
    open,
    currentOwner,
    loadingUsers,
    eligible,
    selected,
    selectedId,
    confirming,
    pending,
    onOpenChange,
    onSelect: setSelectedId,
    onContinue: () => setConfirming(true),
    onBack: () => setConfirming(false),
    onConfirm,
    onInviteAdmin: () => onOpenChange(false),
  };
}
