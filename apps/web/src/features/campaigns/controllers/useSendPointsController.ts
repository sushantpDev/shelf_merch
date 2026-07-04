import { useMemo, useReducer, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useWorkspace, useInvalidateWorkspace } from "@/hooks/useWorkspace";
import { formatWalletAmount } from "@/lib/walletFormat";
import { entityIdForWallet, spendableForWallet } from "@/services/workspace-api";
import { pointsSendTotals } from "@/features/send/money";
import type { PointsSendTotals } from "@/features/send/money";
import { useLaunchPointsCampaign } from "../model";
import type { UiContact, UiWallet } from "../model";
import { initialSendPointsDraft, sendPointsReducer } from "../pointsDraft";
import type { SendPointsAction, SendPointsDraft } from "../pointsDraft";

export type SendPointsStep = 0 | 1 | 2 | 3;

export type SendPointsVm = {
  isLoading: boolean;
  isSending: boolean;
  step: SendPointsStep;
  draft: SendPointsDraft;
  dispatch: (action: SendPointsAction) => void;
  totals: PointsSendTotals;
  contacts: UiContact[];
  shopName: string | undefined;
  wallet: UiWallet | undefined;
  wallets: UiWallet[];
  selectedWalletId: string | undefined;
  onWalletSelect: (walletId: string) => void;
  walletAvailable: (wallet: UiWallet) => number;
  onExit: () => void;
  onNext: () => void;
  onBack: () => void;
  onPayNow: () => void;
  onApplyPromo: () => void;
};

/** Controller for the send-points wizard: draft reducer, step state, totals, payment. */
export function useSendPointsController(): SendPointsVm {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopParam = searchParams.get("shop") ?? undefined;
  const { data: workspace, isLoading } = useWorkspace();
  const refreshWorkspace = useInvalidateWorkspace();
  const launch = useLaunchPointsCampaign();
  const [step, setStep] = useState<SendPointsStep>(0);
  const [sending, setSending] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState("");

  const contacts: UiContact[] = useMemo(() => workspace?.contacts ?? [], [workspace]);
  const shops = workspace?.shops ?? [];
  const shopId = shopParam || shops[0]?.id;
  const shop = shops.find((s) => s.id === shopId);

  const initial = useMemo(
    () =>
      initialSendPointsDraft(
        contacts.slice(0, 2).map((c) => c.id),
        workspace?.account ?? "Shelf Merch",
      ),
    [contacts, workspace?.account],
  );
  const [draft, dispatch] = useReducer(sendPointsReducer, initial);

  const totals = pointsSendTotals(draft.ppr, draft.recips);
  const wallet = workspace?.wallets.find((w) => w.id === selectedWalletId) ?? workspace?.wallets[0];

  async function payNow() {
    const walletId = selectedWalletId || workspace?.wallets[0]?.id;
    const entityId = walletId && workspace ? entityIdForWallet(workspace, walletId) : undefined;
    if (!entityId) {
      toast.error("No budget department found for this wallet — allocate funds first");
      return;
    }
    if (!shopId) {
      toast.error("Select a shop for this campaign");
      return;
    }
    if (!draft.selRecips.length) {
      toast.error("Select at least one recipient");
      return;
    }
    const paymentTotal = Math.round(totals.total);
    if (draft.pay === "wallet") {
      const available = walletId && workspace ? spendableForWallet(workspace, walletId) : 0;
      const payWallet = walletId ? workspace?.wallets.find((w) => w.id === walletId) : undefined;
      if (available < paymentTotal) {
        toast.error(
          `Insufficient wallet balance — ${formatWalletAmount(available, payWallet?.cur)} available`,
        );
        return;
      }
    }
    setSending(true);
    try {
      await launch.mutateAsync({
        entityId: String(entityId),
        shopId: String(shopId),
        name: draft.orderName || "Points campaign",
        creditsPerRecipient: draft.ppr,
        totalBudget: paymentTotal,
        message: { from: draft.from, body: draft.msg },
        contactIds: draft.selRecips,
        contacts: contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
        })),
      });
      await refreshWorkspace();
      toast.success(`Points sent to ${draft.selRecips.length} recipients! 🎉`);
      navigate(`/app/shops/${String(shopId)}`);
    } catch (err) {
      setSending(false);
      toast.error(err instanceof Error ? err.message : "Failed to launch campaign");
    }
  }

  return {
    isLoading: isLoading && !workspace,
    isSending: sending || launch.isPending,
    step,
    draft,
    dispatch,
    totals,
    contacts,
    shopName: shop?.name,
    wallet,
    wallets: workspace?.wallets ?? [],
    selectedWalletId: selectedWalletId || workspace?.wallets[0]?.id,
    onWalletSelect: setSelectedWalletId,
    walletAvailable: (w) => (workspace ? spendableForWallet(workspace, w.id) : 0),
    onExit: () => navigate("/app/campaigns"),
    onNext: () => setStep((s) => Math.min(s + 1, 3) as SendPointsStep),
    onBack: () => setStep((s) => (s - 1) as SendPointsStep),
    onPayNow: payNow,
    onApplyPromo: () => toast("Promo applied"),
  };
}
