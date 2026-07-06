import { useTenantManageController } from "../controllers/useTenantManageController";
import type { TenantRow } from "../model";
import { TenantManageModalView } from "./TenantManageModalView";

/** Thin binding for the tenant manage modal widget. */
export function TenantManageModal({
  row,
  onClose,
  onChanged,
}: {
  row: TenantRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const vm = useTenantManageController(row, onClose, onChanged);
  return <TenantManageModalView {...vm} />;
}
