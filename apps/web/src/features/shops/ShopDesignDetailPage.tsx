import { Link, useParams, useSearchParams } from "react-router";
import { LoadingState } from "@/components/LoadingState";
import { useWorkspace } from "@/hooks/useWorkspace";
import { SwagDesignDetail } from "@/features/swag/SwagDesignDetail";
import { mergeCatalogProductDetails } from "@/services/mappers";
import { collectionLinkedToShop } from "./types";

export function ShopDesignDetailPage() {
  const { id: shopId, collectionId } = useParams() as { id: string; collectionId: string };
  const rawP = Number(useSearchParams()[0].get("p"));
  const productIndex = Number.isFinite(rawP) ? Math.max(0, Math.floor(rawP)) : 0;
  const { data: workspace, isLoading, isError, error } = useWorkspace();

  const shop = workspace?.shops.find((s) => s.id === shopId) ?? null;
  const collection =
    workspace?.collections.find(
      (c) =>
        (c.id === collectionId || c.code === collectionId) &&
        collectionLinkedToShop(c, shopId),
    ) ?? null;
  const rawProduct = collection?.products[productIndex] ?? null;
  const product = rawProduct
    ? mergeCatalogProductDetails(rawProduct, workspace?.catalogProducts ?? [])
    : null;

  if (isLoading && !workspace) {
    return <LoadingState message="Loading design…" fullScreen={false} />;
  }

  if (isError || !workspace) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {error instanceof Error ? error.message : "Could not load design"}
      </div>
    );
  }

  if (!shop || !collection || !product) {
    return (
      <div className="card empty" style={{ padding: 48 }}>
        <h3>Design not found</h3>
        <p>This design may have been removed or is not linked to this shop.</p>
        <Link
          to={`/app/shops/${shopId}?tab=branded-swag`}
          className="btn btn-soft"
          style={{ marginTop: 14 }}
        >
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <SwagDesignDetail
      collection={collection}
      product={product}
      productIndex={productIndex}
      shopId={shopId}
      backLink={{
        href: `/app/shops/${shopId}?tab=branded-swag`,
        label: "Back to shop",
      }}
    />
  );
}
