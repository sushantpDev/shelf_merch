import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Store } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/tenant/PageHeader";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ShopCard } from "./ShopCard";

export function ShopsPage() {
  const { data: workspace, isLoading, isError, error } = useWorkspace();
  const navigate = useNavigate();

  if (isLoading && !workspace) {
    return <LoadingState message="Loading shops…" fullScreen={false} />;
  }
  if (isError || !workspace) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {error instanceof Error ? error.message : "Could not load shops"}
      </div>
    );
  }

  const shops = workspace.shops;
  const fallbackUser = workspace.userPatch.name;

  if (shops.length === 0) {
    return (
      <>
        <PageHeader
          title="Shops"
          subtitle="Branded storefronts your recipients shop from."
          actions={
            <Link to="/app/shops/new" className="btn btn-brand">
              <Plus size={16} /> Create shop
            </Link>
          }
        />
        <div className="card empty">
          <div className="ic" aria-hidden="true">
            <Store size={34} color="#cdd6cf" />
          </div>
          <h3>No shops yet</h3>
          <p>Create one to celebrate a moment.</p>
          <button
            type="button"
            className="btn btn-brand"
            style={{ marginTop: 14 }}
            onClick={() => navigate({ to: "/app/shops/new" })}
          >
            Create your first shop
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Shops"
        subtitle="Branded storefronts your recipients redeem points in."
        actions={
          <Link to="/app/shops/new" className="btn btn-brand">
            <Plus size={16} /> Create shop
          </Link>
        }
      />
      <div className="shops-grid stagger">
        {shops.map((shop) => (
          <ShopCard key={shop.id} shop={shop} fallbackUser={fallbackUser} />
        ))}
      </div>
    </>
  );
}
