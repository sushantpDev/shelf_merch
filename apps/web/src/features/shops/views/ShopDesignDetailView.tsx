import { Link } from "react-router";
import { LoadingState } from "@/components/LoadingState";
import { SwagDesignDetail } from "@/features/swag/SwagDesignDetail";
import type { ShopDesignDetailVm } from "../controllers/useShopDesignDetailController";

/** Shop design detail page: loading/error/not-found states + the swag design detail. */
export function ShopDesignDetailView(vm: ShopDesignDetailVm) {
  if (vm.isLoading) {
    return <LoadingState message="Loading design…" fullScreen={false} />;
  }

  if (vm.errorMessage) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {vm.errorMessage}
      </div>
    );
  }

  if (!vm.shop || !vm.collection || !vm.product) {
    return (
      <div className="card empty" style={{ padding: 48 }}>
        <h3>Design not found</h3>
        <p>This design may have been removed or is not linked to this shop.</p>
        <Link
          to={`/app/shops/${vm.shopId}?tab=branded-swag`}
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
      collection={vm.collection}
      product={vm.product}
      productIndex={vm.productIndex}
      shopId={vm.shopId}
      backLink={{
        href: `/app/shops/${vm.shopId}?tab=branded-swag`,
        label: "Back to shop",
      }}
    />
  );
}
