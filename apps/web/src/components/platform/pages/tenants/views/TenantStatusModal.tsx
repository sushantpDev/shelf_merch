import { useTenantStatusController } from "../controllers/useTenantStatusController";
import type { TenantRow } from "../model";
import { TenantStatusModalView } from "./TenantStatusModalView";

/** Thin binding for the tenant status modal. */
export function TenantStatusModal({
  row,
  onClose,
  onChanged,
}: {
  row: TenantRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const vm = useTenantStatusController(row, onClose, onChanged);
  return <TenantStatusModalView {...vm} />;
}
