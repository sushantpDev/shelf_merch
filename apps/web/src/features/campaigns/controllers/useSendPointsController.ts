import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useWorkspace, useInvalidateWorkspace } from "@/hooks/useWorkspace";
import { formatWalletAmount } from "@/lib/walletFormat";
import { getCampaignApi } from "@/services/mutations-api";
import { entityIdForWallet, spendableForWallet } from "@/services/workspace-api";
import { pointsSendTotals } from "@/features/send/money";
import { toSchedulePayload } from "@/features/send/types";
import type { PointsSendTotals } from "@/features/send/money";
import type { UiShop } from "@/services/mappers";
import { useLaunchPointsCampaign, useSavePointsCampaignDraft } from "../model";
import type { UiContact, UiWallet } from "../model";
import {
  initialSendPointsDraft,
  resolveFrom,
  resolveMessage,
  resolveOrderName,
  sendPointsDraftFromCampaign,
  sendPointsReducer,
} from "../pointsDraft";
import type { SendPointsAction, SendPointsDraft } from "../pointsDraft";

export type SendPointsStep = 0 | 1 | 2 | 3;

export type SendPointsVm = {
  isLoading: boolean;
  isSending: boolean;
  isSaving: boolean;
  step: SendPointsStep;
  draft: SendPointsDraft;
  dispatch: (action: SendPointsAction) => void;
  totals: PointsSendTotals;
  contacts: UiContact[];
  shop: UiShop | undefined;
  shopCurrencyLabel: string;
  stadiumPointsAllowed: boolean;
  wallet: UiWallet | undefined;
  wallets: UiWallet[];
  selectedWalletId: string | undefined;
  onWalletSelect: (walletId: string) => void;
  walletAvailable: (wallet: UiWallet) => number;
  onExit: () => void;
  onNext: () => void;
  onBack: () => void;
  onPayNow: () => void;
  onSaveAndExit: () => void;
  onApplyPromo: () => void;
};

/** Controller for the send-points wizard: draft reducer, hydration, save, and launch. */
export function useSendPointsController(): SendPointsVm {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopParam = searchParams.get("shop") ?? undefined;
  const campaignParam = searchParams.get("campaign") ?? undefined;
  const { data: workspace, isLoading } = useWorkspace();
  const refreshWorkspace = useInvalidateWorkspace();
  const launch = useLaunchPointsCampaign();
  const saveDraft = useSavePointsCampaignDraft();
  const [step, setStep] = useState<SendPointsStep>(0);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrating, setHydrating] = useState(Boolean(campaignParam));
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [campaignId, setCampaignId] = useState<string | undefined>(campaignParam);
  const seededScope = useRef(false);
  const hydratedKey = useRef("");

  const contacts: UiContact[] = useMemo(() => workspace?.contacts ?? [], [workspace]);
  const shops = workspace?.shops ?? [];
  const shopId = shopParam || shops[0]?.id;
  const shop = shops.find((s) => s.id === shopId);

  const initial = useMemo(
    () => initialSendPointsDraft(shop?.pointsConversionEnabled ? "stadium" : "shop"),
    [shop?.pointsConversionEnabled],
  );
  const [draft, dispatch] = useReducer(sendPointsReducer, initial);

  useEffect(() => {
    if (!shop || seededScope.current) return;
    dispatch({
      type: "setPointsScope",
      pointsScope: shop.pointsConversionEnabled ? "stadium" : "shop",
    });
    seededScope.current = true;
  }, [shop]);

  useEffect(() => {
    const key = `${shopId || "default"}:${campaignParam || "new"}`;
    if (!workspace || hydratedKey.current === key) return;

    let cancelled = false;
    async function hydrate() {
      if (campaignParam) {
        setHydrating(true);
        try {
          const campaign = await getCampaignApi(campaignParam);
          if (cancelled) return;
          const restored = sendPointsDraftFromCampaign(campaign, initial);
          dispatch({
            type: "replace",
            draft: {
              ...restored.draft,
              schedule: { ...initial.schedule, ...restored.draft.schedule },
            },
          });
          setStep(restored.step);
          setSelectedWalletId(restored.selectedWalletId);
          setCampaignId(campaign.id);
        } catch (err) {
          if (!cancelled) {
            toast.error(err instanceof Error ? err.message : "Could not load draft");
            dispatch({ type: "replace", draft: initial });
            setStep(0);
            setSelectedWalletId("");
            setCampaignId(undefined);
          }
        } finally {
          if (!cancelled) setHydrating(false);
        }
      } else {
        dispatch({ type: "replace", draft: initial });
        setStep(0);
        setSelectedWalletId("");
        setCampaignId(undefined);
      }
      hydratedKey.current = key;
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [campaignParam, shopId, initial, workspace]);

  const totals = pointsSendTotals(draft.ppr, draft.recips);
  const wallet = workspace?.wallets.find((w) => w.id === selectedWalletId) ?? workspace?.wallets[0];
  const shopCurrencyLabel = shop?.currency || "Points";
  const stadiumPointsAllowed = Boolean(shop?.pointsConversionEnabled);

  function exit() {
    if (shopId) {
      navigate(`/app/shops/${shopId}?tab=sent-gifts`);
      return;
    }
    navigate("/app/campaigns");
  }

  function resolveEntityId() {
    const walletId = selectedWalletId || workspace?.wallets[0]?.id;
    if (walletId && workspace) {
      const entityId = entityIdForWallet(workspace, walletId);
      if (entityId) return entityId;
    }
    const dept = workspace?.org.departments?.[0];
    return dept?.id != null && dept.id !== "" ? String(dept.id) : undefined;
  }

  function buildRecipients() {
    return draft.selRecips
      .map((id) => contacts.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => ({
        contactId: c!.id,
        name: c!.name,
        email: c!.email,
        phone: c!.phone,
      }));
  }

  async function saveAndExit() {
    const entityId = resolveEntityId();
    if (!entityId) {
      toast.error("No budget department found — allocate funds first");
      return;
    }
    if (!shopId) {
      toast.error("Select a shop for this campaign");
      return;
    }
    setSaving(true);
    try {
      const recipients = buildRecipients();
      const schedulePayload = toSchedulePayload(draft.when, draft.schedule);
      const saved = await saveDraft.mutateAsync({
        campaignId,
        entityId,
        shopId: String(shopId),
        name: resolveOrderName(draft.orderName),
        pointsScope: draft.pointsScope,
        creditsPerRecipient: draft.ppr,
        message: {
          from: resolveFrom(draft.from),
          body: resolveMessage(draft.msg),
        },
        schedule: schedulePayload,
        draftState: {
          step,
          selectedWalletId,
          selRecips: draft.selRecips,
          recips: draft.recips,
          pay: draft.pay === "card" ? "card" : "wallet",
          preview: draft.preview,
          when: schedulePayload.mode,
        },
        ...(recipients.length ? { recipients } : {}),
      });
      setCampaignId(saved.id);
      await refreshWorkspace();
      toast.success("Draft saved");
      exit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (step === 0) {
      if (!draft.recips || !draft.ppr) {
        toast.error("Enter number of recipients and budget per recipient");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 3) as SendPointsStep);
  }

  async function payNow() {
    const walletId = selectedWalletId || workspace?.wallets[0]?.id;
    const entityId = resolveEntityId();
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
        campaignId,
        entityId: String(entityId),
        shopId: String(shopId),
        name: resolveOrderName(draft.orderName),
        pointsScope: draft.pointsScope,
        creditsPerRecipient: draft.ppr,
        totalBudget: paymentTotal,
        message: {
          from: resolveFrom(draft.from),
          body: resolveMessage(draft.msg),
        },
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
      navigate(`/app/shops/${String(shopId)}?tab=sent-gifts`);
    } catch (err) {
      setSending(false);
      toast.error(err instanceof Error ? err.message : "Failed to launch campaign");
    }
  }

  return {
    isLoading: (isLoading && !workspace) || hydrating,
    isSending: sending || launch.isPending,
    isSaving: saving || saveDraft.isPending,
    step,
    draft,
    dispatch,
    totals,
    contacts,
    shop,
    shopCurrencyLabel,
    stadiumPointsAllowed,
    wallet,
    wallets: workspace?.wallets ?? [],
    selectedWalletId: selectedWalletId || workspace?.wallets[0]?.id,
    onWalletSelect: setSelectedWalletId,
    walletAvailable: (w) => (workspace ? spendableForWallet(workspace, w.id) : 0),
    onExit: exit,
    onNext: next,
    onBack: () => setStep((s) => (s - 1) as SendPointsStep),
    onPayNow: payNow,
    onSaveAndExit: saveAndExit,
    onApplyPromo: () => toast("Promo applied"),
  };
}
