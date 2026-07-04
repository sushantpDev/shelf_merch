import { useReducer, type Dispatch } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { bannerConfigFromSource } from "../banner";
import { useCreateShop } from "../model";
import {
  INITIAL_SHOP_DRAFT,
  shopDraftReducer,
  type ShopDraft,
  type ShopDraftAction,
} from "../shopDraft";

const LOGO_ACCEPT = /\.(svg|png|webp|jpe?g)$/i;
const LOGO_MAX = 5 * 1024 * 1024;

export type CreateShopVm = {
  draft: ShopDraft;
  dispatch: Dispatch<ShopDraftAction>;
  publishing: boolean;
  onExit: () => void;
  onNext: () => void;
  onPickLogo: (file: File) => void;
  onPublish: () => void;
};

/** Controller for the create-shop wizard: draft reducer, logo upload, publish flow. */
export function useCreateShopController(): CreateShopVm {
  const navigate = useNavigate();
  const createShop = useCreateShop();
  const [draft, dispatch] = useReducer(shopDraftReducer, INITIAL_SHOP_DRAFT);

  function onNext() {
    if (!draft.name.trim()) {
      toast.error("Enter a shop name");
      return;
    }
    dispatch({ type: "set", patch: { step: 1 } });
  }

  function onPickLogo(file: File) {
    if (!LOGO_ACCEPT.test(file.name)) {
      toast.error("Accepted formats: SVG, PNG, WEBP, JPEG, JPG");
      return;
    }
    if (file.size > LOGO_MAX) {
      toast.error("File must be 5 MB or smaller");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => dispatch({ type: "set", patch: { logoUrl: String(reader.result) } });
    reader.readAsDataURL(file);
  }

  async function onPublish() {
    const name = draft.name.trim();
    if (!name) {
      toast.error("Enter a shop name");
      dispatch({ type: "set", patch: { step: 0 } });
      return;
    }
    try {
      const shop = await createShop.mutateAsync({
        name,
        currency: draft.currency,
        categories: draft.categories,
        logoUrl: draft.logoUrl,
        bannerConfig: bannerConfigFromSource({
          bannerTheme: draft.bannerTheme,
          bannerPreset: draft.bannerPreset,
        }),
      });
      toast.success(`"${shop.name}" shop published successfully!`);
      navigate(`/app/shops/${shop.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish shop");
    }
  }

  return {
    draft,
    dispatch,
    publishing: createShop.isPending,
    onExit: () => navigate("/app/shops"),
    onNext,
    onPickLogo,
    onPublish,
  };
}
