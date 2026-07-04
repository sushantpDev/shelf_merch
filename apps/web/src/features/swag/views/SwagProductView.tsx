import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { AddToShopDialog } from "../AddToShopDialog";
import { SwagProductDetail } from "../SwagProductDetail";
import type { SwagProductVm } from "../controllers/useSwagProductController";

/** Swag product detail page: loading/error/not-found states + product detail. */
export function SwagProductView(vm: SwagProductVm) {
  if (vm.isLoading) {
    return <LoadingState message="Loading product…" fullScreen={false} />;
  }

  if (vm.errorMessage) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {vm.errorMessage}
      </div>
    );
  }

  const { collection, product } = vm;
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
        <SwagProductDetail
          target={{ collection, product, pIdx: vm.pIdx }}
          onAddToShop={vm.onOpenAdd}
        />
      </div>

      <AddToShopDialog
        target={vm.addOpen ? { collection, product } : null}
        onOpenChange={vm.onAddOpenChange}
      />
    </>
  );
}
