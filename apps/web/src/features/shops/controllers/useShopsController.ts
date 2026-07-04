import { useNavigate } from "react-router";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import type { UiShop } from "../model";

export type ShopsVm = {
  isLoading: boolean;
  errorMessage: string | null;
  shops: UiShop[];
  fallbackUser: string;
  canCreateShop: boolean;
  onCreateShop: () => void;
};

/** Controller for the shops list: workspace slice, access, create navigation. */
export function useShopsController(): ShopsVm {
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const { canWrite } = useTenantAccess();
  const navigate = useNavigate();

  return {
    isLoading: isLoading && !workspace,
    errorMessage:
      isError || !workspace
        ? error instanceof Error
          ? error.message
          : "Could not load shops"
        : null,
    shops: workspace?.shops ?? [],
    fallbackUser: workspace?.userPatch.name ?? "",
    canCreateShop: canWrite("shops"),
    onCreateShop: () => navigate("/app/shops/new"),
  };
}
