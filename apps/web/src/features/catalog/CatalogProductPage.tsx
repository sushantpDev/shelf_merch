import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ProductDetail } from "./ProductDetail";
import { useCatalogProduct } from "./hooks";

export function CatalogProductPage() {
  const { id } = useParams() as { id: string };
  const { data: workspace } = useWorkspace();
  const { data: product, isLoading, isError, error } = useCatalogProduct(id, workspace);

  const index = workspace?.catalogProducts.findIndex((p) => p.id === id) ?? 0;

  if (isLoading && !product) {
    return <LoadingState message="Loading product…" fullScreen={false} />;
  }

  if (isError) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {error instanceof Error ? error.message : "Could not load product"}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="card empty" style={{ padding: 48 }}>
        <h3>Product not found</h3>
        <p>This product may have been removed from the catalog.</p>
        <Link to="/app/catalog" className="btn btn-soft" style={{ marginTop: 14 }}>
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        to="/app/catalog"
        className="lnk"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14 }}
      >
        <ArrowLeft size={15} /> Back to catalog
      </Link>

      <div className="card" style={{ padding: 24 }}>
        <ProductDetail product={product} index={index >= 0 ? index : 0} />
      </div>
    </>
  );
}
