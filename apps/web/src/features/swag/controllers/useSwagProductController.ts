import { useState } from "react";
import { useParams } from "react-router";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { UiCollection, UiProduct } from "../model";

export type SwagProductVm = {
  isLoading: boolean;
  errorMessage: string | null;
  collection: UiCollection | undefined;
  product: UiProduct | undefined;
  pIdx: number;
  addOpen: boolean;
  onOpenAdd: () => void;
  onAddOpenChange: (open: boolean) => void;
};

/** Controller for the swag product detail page: route params, product lookup, add dialog. */
export function useSwagProductController(): SwagProductVm {
  const { collectionId, pIdx: pIdxParam } = useParams() as {
    collectionId: string;
    pIdx: string;
  };
  const pIdx = Number.parseInt(pIdxParam, 10);
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const [addOpen, setAddOpen] = useState(false);

  const collection = workspace?.collections.find((c) => c.id === collectionId);
  const product = collection && Number.isFinite(pIdx) ? collection.products[pIdx] : undefined;

  return {
    isLoading: isLoading && !workspace,
    errorMessage:
      isError || !workspace
        ? error instanceof Error
          ? error.message
          : "Could not load product"
        : null,
    collection,
    product,
    pIdx,
    addOpen,
    onOpenAdd: () => setAddOpen(true),
    onAddOpenChange: setAddOpen,
  };
}
