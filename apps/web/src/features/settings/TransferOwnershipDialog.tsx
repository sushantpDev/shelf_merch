import {
  useTransferOwnershipController,
  type TransferOwnershipProps,
} from "./controllers/useTransferOwnershipController";
import { TransferOwnershipDialogView } from "./views/TransferOwnershipDialogView";

/** Thin binding for the self-contained transfer-ownership dialog widget. */
export function TransferOwnershipDialog(props: TransferOwnershipProps) {
  const vm = useTransferOwnershipController(props);
  return <TransferOwnershipDialogView {...vm} />;
}
