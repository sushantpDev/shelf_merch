import { useMemo, useReducer, useState, type Dispatch } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useWorkspace, useInvalidateWorkspace } from "@/hooks/useWorkspace";
import { formatWalletAmount } from "@/lib/walletFormat";
import type { UiContact, UiProduct } from "@/services/mappers";
import type { UiWallet } from "@/services/mappers";
import { entityIdForWallet, spendableForWallet } from "@/services/workspace-api";
import { kitSendTotals, type KitSendTotals } from "@/features/send/money";
import { toSchedulePayload } from "@/features/send/types";
import { kitPickedIndices } from "../wizard/kitDraft";
import { useLaunchKitCampaign, useUpdateKit } from "../model";
import type { UiKit } from "../model";
import {
  initialSendKitDraft,
  sendKitReducer,
  type SendKitAction,
  type SendKitDraft,
} from "../send/sendDraft";

export type SendKitStep = 0 | 1 | 2 | 3;

export type SendKitVm = {
  isLoading: boolean;
  isSending: boolean;
  notFound: boolean;
  kit: UiKit | undefined;
  account: string | undefined;
  shopName: string | undefined;
  step: SendKitStep;
  draft: SendKitDraft;
  dispatch: Dispatch<SendKitAction>;
  contacts: UiContact[];
  totals: KitSendTotals;
  surpriseMissing: UiContact[];
  wallet: UiWallet | undefined;
  wallets: UiWallet[];
  selectedWalletId: string | undefined;
  onWalletSelect: (walletId: string) => void;
  walletAvailable: (wallet: UiWallet) => number;
  onExit: () => void;
  onNext: () => void;
  onBack: () => void;
  onPayAndSend: () => void;
};

function missingAddress(contacts: UiContact[], selected: string[]): UiContact[] {
  return contacts.filter(
    (c) => selected.includes(c.id) && (!c.address || !c.city || !c.state || !c.pincode),
  );
}

/** Controller for the send-kit wizard: recipient/experience/checkout state, pay flow. */
export function useSendKitController(): SendKitVm {
  const navigate = useNavigate();
  const { id } = useParams() as { id: string };
  const { data: workspace, isLoading } = useWorkspace();
  const refreshWorkspace = useInvalidateWorkspace();
  const launch = useLaunchKitCampaign();
  const updateKit = useUpdateKit();
  const [step, setStep] = useState<SendKitStep>(0);
  const [sending, setSending] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState("");

  const catalog: UiProduct[] = useMemo(() => workspace?.catalogProducts ?? [], [workspace]);
  const contacts: UiContact[] = useMemo(() => workspace?.contacts ?? [], [workspace]);
  const kit = workspace?.kits.find((k) => k.id === id);

  const initial = useMemo(() => {
    const picked = kit ? kitPickedIndices(kit, catalog) : [];
    const packaging = kit?.packaging === "none" ? "none" : "box";
    const firstRecips = contacts.slice(0, 2).map((c) => c.id);
    return initialSendKitDraft(picked, packaging, firstRecips, workspace?.account ?? "Shelf Merch");
  }, [kit, catalog, contacts, workspace?.account]);

  const [draft, dispatch] = useReducer(sendKitReducer, initial);

  const wallet = workspace?.wallets.find((w) => w.id === selectedWalletId) ?? workspace?.wallets[0];
  const totals = kitSendTotals(draft.selRecips.length, draft.pkg);
  const surpriseMissing =
    draft.mode === "surprise" ? missingAddress(contacts, draft.selRecips) : [];

  function onNext() {
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!draft.selRecips.length) {
        toast.error("Select at least one recipient");
        return;
      }
      if (draft.mode === "surprise" && surpriseMissing.length) {
        toast.error("Complete the shipping address for all surprise recipients");
        return;
      }
      if (draft.mode === "single") {
        const l = draft.singleLocation;
        if (!l.name || !l.email.includes("@") || !l.line1 || !l.city || !l.state || !l.pincode) {
          toast.error("Enter the location contact, email, and complete shipping address");
          return;
        }
      }
    }
    setStep((s) => Math.min(s + 1, 3) as SendKitStep);
  }

  async function onPayAndSend() {
    const walletId = selectedWalletId || workspace?.wallets[0]?.id;
    const entityId = walletId && workspace ? entityIdForWallet(workspace, walletId) : undefined;
    if (!entityId) {
      toast.error("No budget department found for this wallet — allocate funds first");
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
      if (kit && kit.status !== "live") {
        await updateKit.mutateAsync({
          id: kit.id,
          pickedIndices: kitPickedIndices(kit, catalog),
          catalog,
          status: "live",
        });
      }
      await launch.mutateAsync({
        entityId: String(entityId),
        kitId: String(kit!.id),
        name: kit!.name,
        totalBudget: paymentTotal,
        fulfillmentMode:
          draft.mode === "surprise" ? "surprise" : draft.mode === "single" ? "single" : "redeem",
        singleLocation: draft.mode === "single" ? draft.singleLocation : undefined,
        message: { from: draft.from, body: draft.msg },
        schedule: toSchedulePayload(draft.when, draft.schedule),
        contactIds: draft.selRecips,
        contacts: contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
        })),
      });
      await refreshWorkspace();
      toast.success(`Order placed for ${draft.selRecips.length} recipients! 📦`);
      navigate("/app/orders");
    } catch (err) {
      setSending(false);
      toast.error(err instanceof Error ? err.message : "Failed to send kit");
    }
  }

  return {
    isLoading: isLoading && !workspace,
    isSending: sending || launch.isPending,
    notFound: !isLoading && !!workspace && !kit,
    kit,
    account: workspace?.account,
    shopName: workspace?.shops[0]?.name,
    step,
    draft,
    dispatch,
    contacts,
    totals,
    surpriseMissing,
    wallet,
    wallets: workspace?.wallets ?? [],
    selectedWalletId: selectedWalletId || workspace?.wallets[0]?.id,
    onWalletSelect: setSelectedWalletId,
    walletAvailable: (w) => (workspace ? spendableForWallet(workspace, w.id) : 0),
    onExit: () => navigate("/app/kits"),
    onNext,
    onBack: () => setStep((s) => Math.max(s - 1, 0) as SendKitStep),
    onPayAndSend,
  };
}
