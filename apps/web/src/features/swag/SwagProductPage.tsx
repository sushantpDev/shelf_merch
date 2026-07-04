import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { useWorkspace } from "@/hooks/useWorkspace";
import { AddToShopDialog } from "./AddToShopDialog";
import { SwagProductDetail } from "./SwagProductDetail";

export function SwagProductPage() {
  const { collectionId, pIdx: pIdxParam } = useParams() as {
    collectionId: string;
    pIdx: string;
  };
  const pIdx = Number.parseInt(pIdxParam, 10);
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const [addOpen, setAddOpen] = useState(false);

  if (isLoading && !workspace) {
    return <LoadingState message="Loading product…" fullScreen={false} />;
  }

  if (isError || !workspace) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {error instanceof Error ? error.message : "Could not load product"}
      </div>
    );
  }

  const collection = workspace.collections.find((c) => c.id === collectionId);
  const product = collection && Number.isFinite(pIdx) ? collection.products[pIdx] : undefined;

  if (!collection || !product) {
    return (
      <div className="card empty" style={{ padding: 48 }}>
        <h3>Design not found</h3>
        <p>This product may have been removed from your swag library.</p>
        <Link to="/app/swag" className="btn btn-soft" style={{ marginTop: 14 }}>
          Back to swag
        </Link>
      </div>
    );
  }

  const target = { collection, product, pIdx };

  return (
    <>
      <Link
        to="/app/swag"
        className="lnk"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14 }}
      >
        <ArrowLeft size={15} /> Back to swag
      </Link>

      <div className="card" style={{ padding: 24 }}>
        <SwagProductDetail target={target} onAddToShop={() => setAddOpen(true)} />
      </div>

      <AddToShopDialog
        target={addOpen ? { collection, product } : null}
        onOpenChange={setAddOpen}
      />
    </>
  );
}
