import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { getStoredUser } from "@/services/auth-store";
import { canAccessArea } from "@/services/platform-access";
import {
  addOrderNote,
  addShipmentEvent,
  addTicketMessage,
  adjustInventory,
  approveFunding,
  assignOrderVendor,
  assignTicket,
  changeTeamRole,
  createOrderReplacement,
  createShipment,
  deactivateTeamMember,
  fetchAuditLogs,
  fetchFinanceOutstanding,
  fetchFundingApprovals,
  fetchPlatformDashboard,
  fetchPlatformInventory,
  fetchPlatformKits,
  fetchPlatformOrders,
  fetchPlatformOrder,
  fetchPlatformProducts,
  fetchPlatformSettings,
  fetchPlatformShipments,
  fetchPlatformSupport,
  fetchPlatformTeam,
  fetchPlatformTenants,
  fetchPlatformVendors,
  fetchProductionBoard,
  fetchProductionTasks,
  inviteTeamMember,
  ORDER_STATUSES,
  PLATFORM_ROLES,
  PRODUCTION_TASK_STATUSES,
  reactivateTeamMember,
  recordTaskQc,
  rejectFunding,
  resendRedemptionLink,
  resendShipmentTracking,
  resendTicketTracking,
  setInventoryMode,
  setOrderStatus,
  setTaskStatus,
  setTenantPlan,
  setTenantStatus,
  setTicketStatus,
  SHIPMENT_STATUSES,
  SUPPORT_TICKET_STATUSES,
  TENANT_PLANS,
  TENANT_STATUSES,
  updateShipment,
  updateSetting,
  uploadOrderMockup,
  type InventoryTxnType,
  type OrderItemProduct,
  type PrintArea,
  type ProductVariant,
} from "@/services/platform-api";
import { resolveColorHex } from "@/lib/colorMap";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { TintedGarment } from "@/components/store/TintedGarment";
import {
  DataTable,
  inr,
  MetricGrid,
  PlatformError,
  PlatformLoading,
  PlatformModal,
  PlatformPageHeader,
  StatusTag,
} from "./platform-ui";

function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    loader()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Request failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading };
}

export function DashboardPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformDashboard());

  return (
    <>
      <PlatformPageHeader
        title="Dashboard"
        subtitle="Morning glance across tenants, orders, inventory, and finance."
      />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <>
          <MetricGrid
            items={[
              ["Active tenants", data.cards.activeTenants],
              ["Total GMV", inr(data.cards.totalGmvInr)],
              ["Orders in progress", data.cards.ordersInProgress],
              ["Delayed orders", data.cards.delayedOrders],
              ["Open tickets", data.cards.openSupportTickets],
              ["Low stock items", data.cards.lowStockItems],
              ["Outstanding", inr(data.cards.outstandingPaymentsInr)],
            ]}
          />
          {Array.isArray((data.sections as { criticalAlerts?: unknown[] }).criticalAlerts) &&
          (data.sections as { criticalAlerts: unknown[] }).criticalAlerts.length > 0 ? (
            <div className="card" style={{ marginTop: 24, padding: 16 }}>
              <div className="h1" style={{ fontSize: 16, marginBottom: 12 }}>
                Critical alerts
              </div>
              <ul style={{ paddingLeft: 18, color: "var(--ink-2)" }}>
                {(data.sections as { criticalAlerts: Array<{ kind: string; count?: number; amountInr?: number }> }).criticalAlerts.map(
                  (a) => (
                    <li key={a.kind} style={{ marginBottom: 6 }}>
                      {a.kind.replace(/_/g, " ")}
                      {a.count != null ? ` (${a.count})` : ""}
                      {a.amountInr != null ? ` — ${inr(a.amountInr)}` : ""}
                    </li>
                  ),
                )}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

type TenantRow = { _id: string; name: string; slug: string; status: string; plan?: string };

export function TenantsPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<TenantRow | null>(null);
  const { data, error, loading } = useLoad(() => fetchPlatformTenants(), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "tenants", "write");

  const columns: { key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }[] = [
    { key: "name", label: "Tenant" },
    { key: "slug", label: "Slug" },
    { key: "status", label: "Status", render: (r) => <StatusTag status={String(r.status)} /> },
    { key: "plan", label: "Plan", render: (r) => String(r.plan ?? "—") },
    { key: "walletBalanceInr", label: "Wallet", render: (r) => inr(Number(r.walletBalanceInr)) },
    { key: "openOrders", label: "Open orders" },
    { key: "outstandingInr", label: "Outstanding", render: (r) => inr(Number(r.outstandingInr)) },
  ];
  if (canWrite) {
    columns.push({
      key: "manage",
      label: "",
      render: (r) => (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setManaging(r as unknown as TenantRow)}>
          Manage
        </button>
      ),
    });
  }

  return (
    <>
      <PlatformPageHeader title="Tenants" subtitle="All workspaces on the platform." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && <DataTable empty="No tenants yet." rows={data as unknown as Record<string, unknown>[]} columns={columns} />}
      {managing && (
        <TenantManageModal row={managing} onClose={() => setManaging(null)} onChanged={() => setReloadKey((k) => k + 1)} />
      )}
    </>
  );
}

function TenantManageModal({ row, onClose, onChanged }: { row: TenantRow; onClose: () => void; onChanged: () => void }) {
  const [status, setStatus] = useState(row.status);
  const [reason, setReason] = useState("");
  const [plan, setPlan] = useState(row.plan ?? "trial");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setErr("");
    setNote("");
    try {
      await fn();
      setNote(ok);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PlatformModal title={row.name} subtitle={`@${row.slug}`} onClose={onClose}>
      {err && <PlatformError message={err} />}
      {note && <div className="card" style={{ padding: 10, marginBottom: 12, color: "var(--brand)", fontSize: 13 }}>{note}</div>}

      <div className="field">
        <label className="lbl">Account status</label>
        <select className="inp" value={status} onChange={(e) => setStatus(e.target.value)}>
          {TENANT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <input className="inp" placeholder="Reason (optional, for the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} />
      <button type="button" className="btn btn-soft btn-sm" style={{ marginTop: 10 }} disabled={busy || status === row.status}
        onClick={() => run(() => setTenantStatus(row._id, status, reason || undefined), "Status updated.")}>
        Save status
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />

      <div className="field">
        <label className="lbl">Plan</label>
        <select className="inp" value={plan} onChange={(e) => setPlan(e.target.value)}>
          {TENANT_PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <button type="button" className="btn btn-soft btn-sm" disabled={busy || plan === row.plan}
        onClick={() => run(() => setTenantPlan(row._id, plan), "Plan updated.")}>
        Save plan
      </button>
    </PlatformModal>
  );
}

export function OrdersPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformOrders({ limit: 100 }), []);

  const columns: { key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }[] = [
    {
      key: "orderNumber",
      label: "Order #",
      render: (r) => (
        <Link
          to="/platform/orders/$id"
          params={{ id: String(r._id) }}
          style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}
        >
          {String(r.orderNumber ?? "—")}
        </Link>
      ),
    },
    { key: "tenantName", label: "Tenant" },
    { key: "status", label: "Status", render: (r) => <StatusTag status={String(r.status)} /> },
    {
      key: "total",
      label: "Total",
      render: (r) => {
        const b = r.amountBreakdown as { total?: number } | undefined;
        return inr(Number(b?.total ?? 0));
      },
    },
    { key: "createdAt", label: "Created", render: (r) => new Date(String(r.createdAt)).toLocaleDateString("en-IN") },
    {
      key: "open",
      label: "",
      render: (r) => (
        <Link to="/platform/orders/$id" params={{ id: String(r._id) }} className="btn btn-ghost btn-sm">
          Open
        </Link>
      ),
    },
  ];

  return (
    <>
      <PlatformPageHeader title="Orders" subtitle="Cross-tenant order pipeline." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && <DataTable empty="No orders yet." rows={data.items} columns={columns} />}
    </>
  );
}

type OrderItem = {
  name?: string;
  sku?: string;
  qty?: number;
  unitPriceInr?: number;
  imageUrl?: string;
  artworkUrl?: string;
  variant?: { size?: string; color?: string };
  product?: OrderItemProduct | null;
};

function matchVariantHex(product: OrderItemProduct | null | undefined, variant?: { size?: string; color?: string }) {
  if (!product?.variants?.length || !variant) return undefined;
  const match = product.variants.find(
    (v: ProductVariant) =>
      (!variant.size || v.size === variant.size) &&
      (!variant.color || v.color?.toLowerCase() === variant.color.toLowerCase()),
  );
  return match?.colorHex;
}

/** Triggers a download of the artwork; falls back to opening it if blocked (CORS). */
async function downloadArtwork(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  } catch {
    window.open(url, "_blank");
  }
}

function PrintAreaPreview({
  mockup,
  areas,
  tintHex,
  artworkUrl,
}: {
  mockup: string;
  areas: PrintArea[];
  tintHex?: string;
  artworkUrl?: string;
}) {
  const resolvedMockup = resolveMediaUrl(mockup);
  const resolvedArtwork = artworkUrl ? resolveMediaUrl(artworkUrl) : "";
  const visible = areas.filter(
    (a) => !a.mockupImageUrl || resolveMediaUrl(a.mockupImageUrl) === resolvedMockup,
  );
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        <TintedGarment src={mockup} hex={tintHex} alt="Design mockup" />
      </div>
      {visible.map((a, i) => (
        <div
          key={a.key ?? i}
          style={{
            position: "absolute",
            left: `${a.box.xPct}%`,
            top: `${a.box.yPct}%`,
            width: `${a.box.widthPct}%`,
            height: `${a.box.heightPct}%`,
            border: resolvedArtwork ? "1px solid rgba(46,160,103,.5)" : "2px dashed rgba(46,160,103,.7)",
            background: resolvedArtwork ? "transparent" : "rgba(46,160,103,.1)",
            boxSizing: "border-box",
            pointerEvents: "none",
            display: "grid",
            placeItems: "center",
          }}
        >
          {resolvedArtwork && (
            <img src={resolvedArtwork} alt="Artwork" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          )}
          <span
            style={{
              position: "absolute",
              top: -20,
              left: 0,
              fontSize: 11,
              fontWeight: 700,
              color: "var(--ink)",
              background: "#fff",
              padding: "1px 5px",
              borderRadius: 4,
              whiteSpace: "nowrap",
            }}
          >
            {a.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Small rounded pill for order/line-item metadata. */
function Chip({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 12,
        fontWeight: 600,
        color: "var(--ink-2)",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 999,
        padding: "3px 9px",
        whiteSpace: "nowrap",
        fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
      }}
    >
      {children}
    </span>
  );
}

/** A labelled square asset tile used in the fulfilment image strip. */
function FulfillmentTile({ label, children, footer }: { label: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div>
      <div className="lbl" style={{ marginBottom: 6, fontSize: 10.5, letterSpacing: ".05em" }}>{label}</div>
      <div
        style={{
          aspectRatio: "1 / 1",
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
        }}
      >
        {children}
      </div>
      {footer && <div style={{ marginTop: 8 }}>{footer}</div>}
    </div>
  );
}

/** Production print spec: one row per print area. */
function PrintSpecTable({ areas }: { areas: PrintArea[] }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <table className="tbl" style={{ fontSize: 12.5, margin: 0 }}>
        <thead>
          <tr>
            <th>Print area</th>
            <th>Method</th>
            <th>Max size</th>
            <th>DPI</th>
          </tr>
        </thead>
        <tbody>
          {areas.map((a, i) => (
            <tr key={a.key ?? i}>
              <td style={{ fontWeight: 600 }}>{a.label}</td>
              <td style={{ textTransform: "uppercase", letterSpacing: ".03em" }}>
                {a.methods?.length ? a.methods.join(", ") : "—"}
              </td>
              <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {a.maxWidthCm || a.maxHeightCm ? `${a.maxWidthCm ?? "—"}×${a.maxHeightCm ?? "—"} cm` : "—"}
              </td>
              <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{a.dpi ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderFulfillmentActions({
  order,
  onChanged,
}: {
  order: Record<string, unknown>;
  onChanged: () => void;
}) {
  const id = String(order._id);
  const [status, setStatus] = useState(String(order.status ?? "created"));
  const [statusNote, setStatusNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [vendors, setVendors] = useState<{ _id: string; name: string }[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [mockupUrl, setMockupUrl] = useState("");
  const [replacementReason, setReplacementReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okNote, setOkNote] = useState("");

  useEffect(() => {
    fetchPlatformVendors().then(setVendors).catch(() => setVendors([]));
  }, []);

  useEffect(() => {
    setStatus(String(order.status ?? "created"));
  }, [order.status]);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setErr("");
    setOkNote("");
    try {
      await fn();
      setOkNote(ok);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="h1" style={{ fontSize: 16, marginBottom: 16 }}>Fulfillment actions</div>
      {err && <PlatformError message={err} />}
      {okNote && (
        <div className="card" style={{ padding: 10, marginBottom: 12, color: "var(--brand)", fontSize: 13 }}>
          {okNote}
        </div>
      )}

      <div className="field">
        <label className="lbl">Status</label>
        <select className="inp" value={status} onChange={(e) => setStatus(e.target.value)}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>
      <input
        className="inp"
        placeholder="Note (optional)"
        value={statusNote}
        onChange={(e) => setStatusNote(e.target.value)}
      />
      <button
        type="button"
        className="btn btn-soft btn-sm"
        style={{ marginTop: 10 }}
        disabled={busy || status === order.status}
        onClick={() => run(() => setOrderStatus(id, status, statusNote || undefined), "Status updated.")}
      >
        Save status
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="field">
        <label className="lbl">Assign production vendor</label>
        <select className="inp" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
          <option value="">Select a vendor…</option>
          {vendors.map((v) => (
            <option key={v._id} value={v._id}>{v.name}</option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        disabled={busy || !vendorId}
        onClick={() => run(() => assignOrderVendor(id, vendorId), "Vendor assigned.")}
      >
        Assign vendor
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="field">
        <label className="lbl">Internal note</label>
        <input
          className="inp"
          placeholder="Add an internal note"
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={busy || !internalNote.trim()}
        onClick={() => run(() => addOrderNote(id, internalNote.trim()), "Note added.")}
      >
        Add note
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="field">
        <label className="lbl">Mockup image URL</label>
        <input
          className="inp"
          placeholder="https://…"
          value={mockupUrl}
          onChange={(e) => setMockupUrl(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={busy || !mockupUrl.trim()}
        onClick={() => run(() => uploadOrderMockup(id, mockupUrl.trim()), "Mockup attached.")}
      >
        Attach mockup
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="field">
        <label className="lbl">Create replacement (reason)</label>
        <input
          className="inp"
          placeholder="Why a replacement is needed"
          value={replacementReason}
          onChange={(e) => setReplacementReason(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        style={{ color: "var(--danger)" }}
        disabled={busy || !replacementReason.trim()}
        onClick={() => run(() => createOrderReplacement(id, replacementReason.trim()), "Replacement created.")}
      >
        Create replacement order
      </button>
    </div>
  );
}

export function OrderFulfillmentPage({ orderId }: { orderId: string }) {
  const [reloadKey, setReloadKey] = useState(0);
  const { data, error, loading } = useLoad(() => fetchPlatformOrder(orderId), [orderId, reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "orders", "write");
  const reload = () => setReloadKey((k) => k + 1);

  const tenant = data?.tenant as { name?: string } | undefined;
  const campaign = data?.campaign as { name?: string; type?: string } | undefined;
  const recipient = data?.recipient as { name?: string; email?: string; phone?: string } | undefined;
  const shipping = data?.shippingAddress as {
    name?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | undefined;
  const breakdown = data?.amountBreakdown as { total?: number; subtotal?: number; gst?: number } | undefined;
  const items = (data?.items as OrderItem[] | undefined) ?? [];
  const mockupUrl = String(data?.mockupUrl ?? "");
  const internalNotes = (data?.internalNotes as Array<{ body: string; at: string }> | undefined) ?? [];
  const statusHistory = (data?.statusHistory as Array<{ status: string; at: string; note?: string }> | undefined) ?? [];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link to="/platform/orders" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
          ← Back to orders
        </Link>
      </div>
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <>
          <PlatformPageHeader
            title={String(data.orderNumber ?? "Order")}
            subtitle={
              [
                tenant?.name ? `Tenant: ${tenant.name}` : null,
                campaign?.name ? `Campaign: ${campaign.name}` : null,
                `${items.length} line item${items.length === 1 ? "" : "s"}`,
              ]
                .filter(Boolean)
                .join("  ·  ") || "Order fulfillment"
            }
            actions={<StatusTag status={String(data.status)} />}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: canWrite ? "1fr 340px" : "1fr",
              gap: 24,
              alignItems: "start",
            }}
          >
            <div>
              <div className="card" style={{ padding: 20, marginBottom: 24 }}>
                <div className="h1" style={{ fontSize: 16, marginBottom: 16 }}>Order summary</div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 16,
                    fontSize: 14,
                  }}
                >
                  <div>
                    <div className="lbl">Created</div>
                    <div>{new Date(String(data.createdAt)).toLocaleString("en-IN")}</div>
                  </div>
                  <div>
                    <div className="lbl">Total</div>
                    <div>{inr(Number(breakdown?.total ?? 0))}</div>
                  </div>
                  <div>
                    <div className="lbl">Subtotal</div>
                    <div>{inr(Number(breakdown?.subtotal ?? 0))}</div>
                  </div>
                  <div>
                    <div className="lbl">GST</div>
                    <div>{inr(Number(breakdown?.gst ?? 0))}</div>
                  </div>
                </div>

                {(recipient || shipping) && (
                  <>
                    <div className="divider" style={{ margin: "18px 0" }} />
                    <div className="h1" style={{ fontSize: 14, marginBottom: 12 }}>Recipient &amp; shipping</div>
                    {recipient && (
                      <div style={{ fontSize: 14, marginBottom: 8 }}>
                        <strong>{recipient.name}</strong>
                        {recipient.email ? ` · ${recipient.email}` : ""}
                        {recipient.phone ? ` · ${recipient.phone}` : ""}
                      </div>
                    )}
                    {shipping && (
                      <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>
                        {shipping.name && <div>{shipping.name}</div>}
                        {shipping.line1 && <div>{shipping.line1}</div>}
                        {shipping.line2 && <div>{shipping.line2}</div>}
                        <div>
                          {[shipping.city, shipping.state, shipping.pincode].filter(Boolean).join(", ")}
                        </div>
                        {shipping.phone && <div>{shipping.phone}</div>}
                      </div>
                    )}
                  </>
                )}

                {mockupUrl && (
                  <>
                    <div className="divider" style={{ margin: "18px 0" }} />
                    <div className="lbl" style={{ marginBottom: 8 }}>Order mockup</div>
                    <img
                      src={mockupUrl}
                      alt="Order mockup"
                      style={{ maxWidth: 280, maxHeight: 280, borderRadius: 8, border: "1px solid var(--line)" }}
                    />
                  </>
                )}
              </div>

              <div className="h1" style={{ fontSize: 16, marginBottom: 16 }}>
                Production line items <span className="muted" style={{ fontWeight: 400 }}>({items.length})</span>
              </div>
              {items.map((item, idx) => {
                const product = item.product;
                const variant = item.variant;
                const tintHex = resolveColorHex(variant?.color, matchVariantHex(product, variant));
                const rawArtworkUrl = item.artworkUrl || product?.artworkUrl || "";
                const artworkUrl = rawArtworkUrl ? resolveMediaUrl(rawArtworkUrl) : "";
                const printAreas = product?.printAreas ?? [];
                const mockup = resolveMediaUrl(
                  printAreas[0]?.mockupImageUrl ||
                    product?.maskImageUrl ||
                    product?.primaryImageUrl ||
                    product?.imageUrls?.[0] ||
                    item.imageUrl ||
                    "",
                );

                const baseImg = product?.baseImageUrl ? resolveMediaUrl(product.baseImageUrl) : "";
                return (
                  <div key={idx} className="card" style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}>
                    {/* Work-order header strip */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "12px 18px",
                        borderBottom: "1px solid var(--line)",
                        background: "var(--surface-2)",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 15, marginRight: 4 }}>
                        {item.name ?? product?.name ?? "Product"}
                      </div>
                      <Chip mono>{item.sku || "—"}</Chip>
                      {variant?.size ? <Chip>Size {variant.size}</Chip> : null}
                      {variant?.color ? (
                        <Chip>
                          <span style={{ width: 11, height: 11, borderRadius: 3, background: tintHex, border: "1px solid rgba(0,0,0,.2)" }} />
                          {variant.color}
                        </Chip>
                      ) : null}
                      <Chip>Qty {item.qty ?? 1}</Chip>
                      {item.unitPriceInr != null ? (
                        <div style={{ marginLeft: "auto", fontSize: 13, color: "var(--ink-2)" }}>
                          {inr(item.unitPriceInr)} each
                        </div>
                      ) : null}
                    </div>

                    {/* Asset strip + print spec */}
                    <div style={{ padding: 18 }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                          gap: 14,
                          marginBottom: printAreas.length ? 16 : 0,
                        }}
                      >
                        {artworkUrl && (
                          <FulfillmentTile
                            label="Artwork — to print"
                            footer={
                              <button
                                type="button"
                                className="btn btn-soft btn-sm"
                                style={{ width: "100%" }}
                                onClick={() => downloadArtwork(artworkUrl, `${item.sku || "artwork"}-design`)}
                              >
                                ↓ Download
                              </button>
                            }
                          >
                            <img src={artworkUrl} alt="Artwork" style={{ maxWidth: "82%", maxHeight: "82%", objectFit: "contain" }} />
                          </FulfillmentTile>
                        )}
                        <FulfillmentTile label="Base — production">
                          {baseImg ? (
                            <img src={baseImg} alt="Base" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            <span className="mut3" style={{ fontSize: 12 }}>Not available</span>
                          )}
                        </FulfillmentTile>
                        <FulfillmentTile label="Mask — tinted">
                          <TintedGarment src={product?.maskImageUrl} hex={tintHex} alt={`${variant?.color ?? "Garment"} mask`} />
                        </FulfillmentTile>
                        {printAreas.length > 0 && mockup && (
                          <div>
                            <div className="lbl" style={{ marginBottom: 6, fontSize: 10.5, letterSpacing: ".05em" }}>
                              {artworkUrl ? "Reference mockup" : "Print areas"}
                            </div>
                            <PrintAreaPreview mockup={mockup} areas={printAreas} tintHex={tintHex} artworkUrl={artworkUrl || undefined} />
                          </div>
                        )}
                      </div>

                      {printAreas.length > 0 && <PrintSpecTable areas={printAreas} />}
                    </div>
                  </div>
                );
              })}

              {(internalNotes.length > 0 || statusHistory.length > 0) && (
                <div className="card" style={{ padding: 20, marginTop: 8 }}>
                  {statusHistory.length > 0 && (
                    <>
                      <div className="h1" style={{ fontSize: 14, marginBottom: 12 }}>Status timeline</div>
                      <ul style={{ paddingLeft: 18, fontSize: 13, color: "var(--ink-2)", margin: "0 0 16px" }}>
                        {statusHistory.map((h, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            <StatusTag status={h.status} />
                            {" · "}
                            {new Date(h.at).toLocaleString("en-IN")}
                            {h.note ? ` — ${h.note}` : ""}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {internalNotes.length > 0 && (
                    <>
                      <div className="h1" style={{ fontSize: 14, marginBottom: 12 }}>Internal notes</div>
                      <ul style={{ paddingLeft: 18, fontSize: 13, color: "var(--ink-2)", margin: 0 }}>
                        {internalNotes.map((n, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            {n.body}
                            <span className="muted"> · {new Date(n.at).toLocaleString("en-IN")}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>

            {canWrite && (
              <OrderFulfillmentActions order={data} onChanged={reload} />
            )}
          </div>
        </>
      )}
    </>
  );
}

export function CatalogPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformProducts({ limit: 100 }));
  const canWrite = canAccessArea(getStoredUser()?.role, "catalog", "write");

  return (
    <>
      <PlatformPageHeader
        title="Catalog"
        subtitle="Platform product master with internal cost and margin."
        actions={
          canWrite ? (
            <>
              <Link to="/platform/catalog/import" className="btn btn-ghost btn-sm">
                Import from Shopify
              </Link>
              <Link to="/platform/catalog/new" className="btn btn-brand btn-sm">
                + New product
              </Link>
            </>
          ) : null
        }
      />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No products yet."
          rows={data.items as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: "name",
              label: "Product",
              render: (r) => (
                <Link to="/platform/catalog/$id" params={{ id: String(r._id) }} className="lnk">
                  {String(r.name)}
                </Link>
              ),
            },
            { key: "sku", label: "SKU" },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusTag status={String(r.status)} />,
            },
            {
              key: "sellingPriceInr",
              label: "Sell",
              render: (r) => inr(Number(r.sellingPriceInr)),
            },
            {
              key: "costPriceInr",
              label: "Cost",
              render: (r) => inr(Number(r.costPriceInr)),
            },
            {
              key: "marginPct",
              label: "Margin",
              render: (r) => `${Number(r.marginPct)}%`,
            },
            {
              key: "stock",
              label: "Available",
              render: (r) => String((r.inventory as { available?: number })?.available ?? 0),
            },
          ]}
        />
      )}
    </>
  );
}

type InventoryRow = {
  productId: string;
  name: string;
  sku: string;
  mode: string;
  available: number;
  reserved: number;
  lowStockThreshold: number;
  stockStatus: string;
};

export function InventoryPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<InventoryRow | null>(null);
  const { data, error, loading } = useLoad(() => fetchPlatformInventory(100), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "inventory", "write");

  const columns: { key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }[] = [
    { key: "name", label: "Product" },
    { key: "sku", label: "SKU" },
    {
      key: "available",
      label: "Available",
      render: (r: Record<string, unknown>) => (r.mode === "made_to_order" ? "—" : String(r.available)),
    },
    {
      key: "reserved",
      label: "Reserved",
      render: (r: Record<string, unknown>) => (r.mode === "made_to_order" ? "—" : String(r.reserved)),
    },
    { key: "lowStockThreshold", label: "Threshold" },
    {
      key: "stockStatus",
      label: "Status",
      render: (r: Record<string, unknown>) => <StatusTag status={String(r.stockStatus)} />,
    },
  ];
  if (canWrite) {
    columns.push({
      key: "manage",
      label: "",
      render: (r: Record<string, unknown>) => (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setManaging(r as unknown as InventoryRow)}
        >
          Manage
        </button>
      ),
    });
  }

  return (
    <>
      <PlatformPageHeader
        title="Inventory"
        subtitle="Stock levels and low-stock alerts. Made-to-order products aren't stocked, so they don't show an availability count."
      />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable empty="No inventory rows." rows={data.items as unknown as Record<string, unknown>[]} columns={columns} />
      )}
      {managing && (
        <InventoryManageModal
          row={managing}
          onClose={() => setManaging(null)}
          onChanged={() => setReloadKey((k) => k + 1)}
        />
      )}
    </>
  );
}

function InventoryManageModal({
  row,
  onClose,
  onChanged,
}: {
  row: InventoryRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [mode, setMode] = useState<"physical" | "made_to_order">(
    row.mode === "made_to_order" ? "made_to_order" : "physical",
  );
  const [threshold, setThreshold] = useState(row.lowStockThreshold);
  const [txnType, setTxnType] = useState<InventoryTxnType>("add");
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  async function saveMode() {
    setBusy(true);
    setErr("");
    setNote("");
    try {
      await setInventoryMode(row.productId, { mode, lowStockThreshold: threshold });
      setNote("Mode & threshold saved.");
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update mode");
    } finally {
      setBusy(false);
    }
  }

  async function applyStock() {
    if (qty === 0) {
      setErr("Enter a quantity.");
      return;
    }
    if (!reason.trim()) {
      setErr("Add a reason for the change.");
      return;
    }
    setBusy(true);
    setErr("");
    setNote("");
    try {
      await adjustInventory(row.productId, { type: txnType, qty: Math.abs(qty), reason: reason.trim() });
      setNote("Stock updated.");
      setQty(0);
      setReason("");
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update stock");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}
    >
      <div className="card" onClick={(e) => e.stopPropagation()} style={{ padding: 24, maxWidth: 460, width: "100%" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <h3 style={{ fontSize: 18 }}>{row.name}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 16 }}>{row.sku}</p>

        {err && <PlatformError message={err} />}
        {note && (
          <div className="card" style={{ padding: 10, marginBottom: 12, color: "var(--brand)", fontSize: 13 }}>{note}</div>
        )}

        <div className="field">
          <label className="lbl">Fulfilment mode</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className={mode === "physical" ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"} onClick={() => setMode("physical")}>
              Physical (track stock)
            </button>
            <button type="button" className={mode === "made_to_order" ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"} onClick={() => setMode("made_to_order")}>
              Made to order
            </button>
          </div>
        </div>
        {mode === "physical" && (
          <div className="field">
            <label className="lbl">Low-stock threshold</label>
            <input className="inp" type="number" min={0} value={threshold} onChange={(e) => setThreshold(Math.max(0, Number(e.target.value)))} />
          </div>
        )}
        <button type="button" className="btn btn-soft btn-sm" disabled={busy} onClick={saveMode}>
          Save mode & threshold
        </button>

        {mode === "physical" ? (
          <>
            <div className="divider" style={{ margin: "18px 0" }} />
            <label className="lbl">Adjust stock</label>
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              {(["add", "reduce", "adjust"] as const).map((t) => (
                <button key={t} type="button" className={txnType === t ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"} onClick={() => setTxnType(t)}>
                  {t === "add" ? "Restock" : t === "reduce" ? "Remove" : "Correct"}
                </button>
              ))}
            </div>
            <div className="row" style={{ gap: 8 }}>
              <input className="inp" type="number" placeholder="Qty" value={qty || ""} onChange={(e) => setQty(Number(e.target.value))} style={{ width: 100 }} />
              <input className="inp" placeholder="Reason (e.g. PO #1234)" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <button type="button" className="btn btn-brand btn-sm" style={{ marginTop: 10 }} disabled={busy} onClick={applyStock}>
              Apply stock change
            </button>
          </>
        ) : (
          <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>
            Made-to-order products are produced per order and don't track stock.
          </p>
        )}
      </div>
    </div>
  );
}

export function KitsPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformKits());

  const canWrite = canAccessArea(getStoredUser()?.role, "kits", "write");

  return (
    <>
      <PlatformPageHeader
        title="Kits"
        subtitle="Platform-curated gift bundles."
        actions={
          canWrite ? (
            <Link to="/platform/kits/new" className="btn btn-brand btn-sm">
              + Create a kit
            </Link>
          ) : null
        }
      />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No kits yet."
          rows={data as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: "name",
              label: "Kit",
              render: (r) => (
                <Link to="/platform/kits/$id" params={{ id: String(r._id) }} className="lnk">
                  {String(r.name)}
                </Link>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusTag status={String(r.status)} />,
            },
            {
              key: "approxValueInr",
              label: "Approx value",
              render: (r) => inr(Number(r.approxValueInr)),
            },
            {
              key: "items",
              label: "Items",
              render: (r) => String(Array.isArray(r.items) ? r.items.length : 0),
            },
          ]}
        />
      )}
    </>
  );
}

export function ShipmentsPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);
  const { data, error, loading } = useLoad(() => fetchPlatformShipments(100), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "shipments", "write");
  const reload = () => setReloadKey((k) => k + 1);

  const columns: { key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }[] = [
    { key: "awb", label: "AWB", render: (r) => String(r.awb ?? r.trackingNumber ?? "—") },
    { key: "courier", label: "Courier" },
    { key: "orderNumber", label: "Order", render: (r) => String(r.orderNumber ?? "—") },
    { key: "status", label: "Status", render: (r) => <StatusTag status={String(r.status)} /> },
    { key: "createdAt", label: "Created", render: (r) => new Date(String(r.createdAt)).toLocaleDateString("en-IN") },
  ];
  if (canWrite) {
    columns.push({
      key: "manage",
      label: "",
      render: (r) => <button type="button" className="btn btn-ghost btn-sm" onClick={() => setManaging(r)}>Manage</button>,
    });
  }

  return (
    <>
      <PlatformPageHeader
        title="Shipments"
        subtitle="AWB tracking and delivery exceptions."
        actions={canWrite ? <button type="button" className="btn btn-brand btn-sm" onClick={() => setCreating(true)}>+ New shipment</button> : null}
      />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && <DataTable empty="No shipments yet." rows={data.items} columns={columns} />}
      {managing && <ShipmentManageModal row={managing} onClose={() => setManaging(null)} onChanged={reload} />}
      {creating && <ShipmentCreateModal onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload(); }} />}
    </>
  );
}

function ShipmentCreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [orderId, setOrderId] = useState("");
  const [courier, setCourier] = useState("");
  const [awb, setAwb] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!orderId.trim() || !courier.trim() || !awb.trim()) {
      setErr("Order ID, courier and AWB are required.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await createShipment({ orderId: orderId.trim(), courier: courier.trim(), awb: awb.trim(), trackingUrl: trackingUrl.trim() || undefined });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create shipment");
      setBusy(false);
    }
  }

  return (
    <PlatformModal title="New shipment" onClose={onClose}>
      {err && <PlatformError message={err} />}
      <div className="field"><label className="lbl">Order ID</label><input className="inp" value={orderId} onChange={(e) => setOrderId(e.target.value)} /></div>
      <div className="field"><label className="lbl">Courier</label><input className="inp" value={courier} onChange={(e) => setCourier(e.target.value)} /></div>
      <div className="field"><label className="lbl">AWB</label><input className="inp" value={awb} onChange={(e) => setAwb(e.target.value)} /></div>
      <div className="field"><label className="lbl">Tracking URL (optional)</label><input className="inp" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} /></div>
      <button type="button" className="btn btn-brand btn-block" disabled={busy} onClick={submit}>{busy ? "Creating…" : "Create shipment"}</button>
    </PlatformModal>
  );
}

function ShipmentManageModal({ row, onClose, onChanged }: { row: Record<string, unknown>; onClose: () => void; onChanged: () => void }) {
  const id = String(row._id);
  const [evStatus, setEvStatus] = useState(String(row.status ?? "pending"));
  const [location, setLocation] = useState("");
  const [evNote, setEvNote] = useState("");
  const [courier, setCourier] = useState(String(row.courier ?? ""));
  const [awb, setAwb] = useState(String(row.awb ?? ""));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okNote, setOkNote] = useState("");

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setErr("");
    setOkNote("");
    try {
      await fn();
      setOkNote(ok);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PlatformModal title={`Shipment ${row.awb ?? ""}`} subtitle={String(row.courier ?? "")} onClose={onClose}>
      {err && <PlatformError message={err} />}
      {okNote && <div className="card" style={{ padding: 10, marginBottom: 12, color: "var(--brand)", fontSize: 13 }}>{okNote}</div>}

      <label className="lbl">Add tracking event</label>
      <div className="field">
        <select className="inp" value={evStatus} onChange={(e) => setEvStatus(e.target.value)}>
          {SHIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <input className="inp" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input className="inp" placeholder="Note" value={evNote} onChange={(e) => setEvNote(e.target.value)} />
      </div>
      <button type="button" className="btn btn-soft btn-sm" style={{ marginTop: 10 }} disabled={busy}
        onClick={() => run(() => addShipmentEvent(id, { status: evStatus, location: location || undefined, note: evNote || undefined }), "Event added.")}>
        Add event
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <label className="lbl">Edit courier / AWB</label>
      <div className="row" style={{ gap: 8 }}>
        <input className="inp" placeholder="Courier" value={courier} onChange={(e) => setCourier(e.target.value)} />
        <input className="inp" placeholder="AWB" value={awb} onChange={(e) => setAwb(e.target.value)} />
      </div>
      <button type="button" className="btn btn-soft btn-sm" style={{ marginTop: 10 }} disabled={busy || (courier === row.courier && awb === row.awb) || !courier.trim() || !awb.trim()}
        onClick={() => run(() => updateShipment(id, { courier: courier.trim(), awb: awb.trim() }), "Shipment updated.")}>
        Save changes
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <button type="button" className="btn btn-ghost btn-sm" disabled={busy}
        onClick={() => run(() => resendShipmentTracking(id), "Tracking email resent.")}>
        Resend tracking email
      </button>
    </PlatformModal>
  );
}

export function SupportPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<Record<string, unknown> | null>(null);
  const { data, error, loading } = useLoad(() => fetchPlatformSupport(100), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "support", "write");

  const columns: { key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }[] = [
    { key: "subject", label: "Subject" },
    { key: "type", label: "Type" },
    { key: "status", label: "Status", render: (r) => <StatusTag status={String(r.status)} /> },
    { key: "createdAt", label: "Opened", render: (r) => new Date(String(r.createdAt)).toLocaleDateString("en-IN") },
  ];
  if (canWrite) {
    columns.push({
      key: "manage",
      label: "",
      render: (r) => <button type="button" className="btn btn-ghost btn-sm" onClick={() => setManaging(r)}>Manage</button>,
    });
  }

  return (
    <>
      <PlatformPageHeader title="Support" subtitle="Cross-tenant help desk queue." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && <DataTable empty="No tickets." rows={data.items} columns={columns} />}
      {managing && (
        <SupportManageModal row={managing} onClose={() => setManaging(null)} onChanged={() => setReloadKey((k) => k + 1)} />
      )}
    </>
  );
}

function SupportManageModal({ row, onClose, onChanged }: { row: Record<string, unknown>; onClose: () => void; onChanged: () => void }) {
  const id = String(row._id);
  const [status, setStatus] = useState(String(row.status ?? "open"));
  const [team, setTeam] = useState<{ userId: string; name: string }[]>([]);
  const [assignee, setAssignee] = useState("");
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okNote, setOkNote] = useState("");

  useEffect(() => {
    fetchPlatformTeam().then((t) => setTeam(t.filter((m) => m.status === "active"))).catch(() => setTeam([]));
  }, []);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setErr("");
    setOkNote("");
    try {
      await fn();
      setOkNote(ok);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PlatformModal title={String(row.subject ?? "Ticket")} subtitle={String(row.type ?? "")} onClose={onClose}>
      {err && <PlatformError message={err} />}
      {okNote && <div className="card" style={{ padding: 10, marginBottom: 12, color: "var(--brand)", fontSize: 13 }}>{okNote}</div>}

      <div className="field">
        <label className="lbl">Status</label>
        <select className="inp" value={status} onChange={(e) => setStatus(e.target.value)}>
          {SUPPORT_TICKET_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>
      <button type="button" className="btn btn-soft btn-sm" disabled={busy || status === row.status}
        onClick={() => run(() => setTicketStatus(id, status), "Status updated.")}>
        Save status
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="field">
        <label className="lbl">Assign to</label>
        <select className="inp" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">Select a team member…</option>
          {team.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
        </select>
      </div>
      <button type="button" className="btn btn-soft btn-sm" disabled={busy || !assignee}
        onClick={() => run(() => assignTicket(id, assignee), "Ticket assigned.")}>
        Assign
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="field">
        <label className="lbl">Reply</label>
        <textarea className="inp" rows={3} value={reply} onChange={(e) => setReply(e.target.value)} />
        <label className="row" style={{ gap: 6, alignItems: "center", fontSize: 13, marginTop: 6 }}>
          <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note (not sent to customer)
        </label>
      </div>
      <button type="button" className="btn btn-brand btn-sm" disabled={busy || !reply.trim()}
        onClick={() => run(async () => { await addTicketMessage(id, reply.trim(), internal); setReply(""); }, "Reply added.")}>
        Send reply
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="row" style={{ gap: 8 }}>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy}
          onClick={() => run(() => resendRedemptionLink(id), "Redemption link resent.")}>
          Resend redemption link
        </button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy}
          onClick={() => run(() => resendTicketTracking(id), "Tracking link resent.")}>
          Resend tracking link
        </button>
      </div>
    </PlatformModal>
  );
}

export function ProductionPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<Record<string, unknown> | null>(null);
  const board = useLoad(() => fetchProductionBoard(), [reloadKey]);
  const tasks = useLoad(() => fetchProductionTasks({ limit: 100 }), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "production", "write");
  const data = board.data;

  const taskColumns: { key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }[] = [
    { key: "_id", label: "Task", render: (r) => String(r._id).slice(-6) },
    { key: "orderId", label: "Order", render: (r) => String(r.orderId ?? "").slice(-6) },
    { key: "assignedTo", label: "Assignee", render: (r) => String(r.assignedTo || "—") },
    { key: "status", label: "Status", render: (r) => <StatusTag status={String(r.status)} /> },
    { key: "qcResult", label: "QC", render: (r) => String(r.qcResult || "—") },
  ];
  if (canWrite) {
    taskColumns.push({
      key: "manage",
      label: "",
      render: (r) => <button type="button" className="btn btn-ghost btn-sm" onClick={() => setManaging(r)}>Manage</button>,
    });
  }

  return (
    <>
      <PlatformPageHeader title="Production" subtitle="Task board and orders in production." />
      {board.loading && <PlatformLoading />}
      {board.error && <PlatformError message={board.error} />}
      {data && (
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="h1" style={{ fontSize: 16, marginBottom: 12 }}>Tasks by status</div>
            {Object.entries(data.taskBuckets).map(([status, bucket]) => (
              <div key={status} className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <StatusTag status={status} />
                <span className="num">{bucket.count}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="h1" style={{ fontSize: 16, marginBottom: 12 }}>Orders in production</div>
            {Object.entries(data.orderBuckets).map(([status, bucket]) =>
              bucket.count > 0 ? (
                <div key={status} className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                  <StatusTag status={status} />
                  <span className="num">{bucket.count}</span>
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}

      <h3 style={{ margin: "24px 0 12px" }}>Production tasks</h3>
      {tasks.error && <PlatformError message={tasks.error} />}
      {tasks.data && <DataTable empty="No production tasks." rows={tasks.data.items} columns={taskColumns} />}
      {managing && (
        <TaskManageModal row={managing} onClose={() => setManaging(null)} onChanged={() => setReloadKey((k) => k + 1)} />
      )}
    </>
  );
}

function TaskManageModal({ row, onClose, onChanged }: { row: Record<string, unknown>; onClose: () => void; onChanged: () => void }) {
  const id = String(row._id);
  const [status, setStatus] = useState(String(row.status ?? "created"));
  const [note, setNote] = useState("");
  const [qcPassed, setQcPassed] = useState(true);
  const [qcReason, setQcReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okNote, setOkNote] = useState("");

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setErr("");
    setOkNote("");
    try {
      await fn();
      setOkNote(ok);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PlatformModal title={`Task ${id.slice(-6)}`} subtitle={`Order ${String(row.orderId ?? "").slice(-6)}`} onClose={onClose}>
      {err && <PlatformError message={err} />}
      {okNote && <div className="card" style={{ padding: 10, marginBottom: 12, color: "var(--brand)", fontSize: 13 }}>{okNote}</div>}

      <div className="field">
        <label className="lbl">Advance status</label>
        <select className="inp" value={status} onChange={(e) => setStatus(e.target.value)}>
          {PRODUCTION_TASK_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>
      <input className="inp" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="button" className="btn btn-soft btn-sm" style={{ marginTop: 10 }} disabled={busy || status === row.status}
        onClick={() => run(() => setTaskStatus(id, status, note || undefined), "Status updated.")}>
        Save status
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <label className="lbl">Quality check</label>
      <div className="row" style={{ gap: 8, marginBottom: 8 }}>
        <button type="button" className={qcPassed ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"} onClick={() => setQcPassed(true)}>Pass</button>
        <button type="button" className={!qcPassed ? "btn btn-dark btn-sm" : "btn btn-ghost btn-sm"} onClick={() => setQcPassed(false)}>Fail</button>
      </div>
      {!qcPassed && <input className="inp" placeholder="Failure reason" value={qcReason} onChange={(e) => setQcReason(e.target.value)} />}
      <button type="button" className="btn btn-brand btn-sm" style={{ marginTop: 10 }} disabled={busy || (!qcPassed && !qcReason.trim())}
        onClick={() => run(() => recordTaskQc(id, qcPassed, qcReason.trim() || undefined), "QC recorded.")}>
        Record QC
      </button>
    </PlatformModal>
  );
}

type FundingRow = { walletId: string; walletName: string; tenantName: string; balance: number };

export function FinancePage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [acting, setActing] = useState<{ row: FundingRow; mode: "approve" | "reject" } | null>(null);
  const outstanding = useLoad(() => fetchFinanceOutstanding());
  const funding = useLoad(() => fetchFundingApprovals(), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "finance", "write");

  const fundingColumns: { key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }[] = [
    { key: "walletName", label: "Wallet" },
    { key: "tenantName", label: "Tenant" },
    { key: "balance", label: "Balance", render: (r) => inr(Number(r.balance ?? 0)) },
    {
      key: "fundingDocument",
      label: "Status",
      render: (r) => {
        const doc = r.fundingDocument as { approvalStatus?: string } | undefined;
        return <StatusTag status={String(doc?.approvalStatus ?? "pending")} />;
      },
    },
  ];
  if (canWrite) {
    fundingColumns.push({
      key: "act",
      label: "",
      render: (r) => (
        <div className="row" style={{ gap: 6 }}>
          <button type="button" className="btn btn-brand btn-sm" onClick={() => setActing({ row: r as unknown as FundingRow, mode: "approve" })}>Approve</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setActing({ row: r as unknown as FundingRow, mode: "reject" })}>Reject</button>
        </div>
      ),
    });
  }

  return (
    <>
      <PlatformPageHeader title="Finance" subtitle="Outstanding balances and wallet funding approvals." />
      {(outstanding.loading || funding.loading) && <PlatformLoading />}
      {outstanding.error && <PlatformError message={outstanding.error} />}
      {funding.error && <PlatformError message={funding.error} />}
      {outstanding.data && (
        <>
          <h3 style={{ marginBottom: 12 }}>Outstanding by tenant</h3>
          <DataTable
            empty="No outstanding invoices."
            rows={outstanding.data as unknown as Record<string, unknown>[]}
            columns={[
              { key: "tenantName", label: "Tenant" },
              { key: "outstandingInr", label: "Outstanding", render: (r) => inr(Number(r.outstandingInr)) },
            ]}
          />
        </>
      )}
      {funding.data && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 12 }}>Funding approvals</h3>
          <DataTable
            empty="No pending funding requests."
            rows={(Array.isArray(funding.data) ? funding.data : []) as Record<string, unknown>[]}
            columns={fundingColumns}
          />
        </div>
      )}
      {acting && (
        <FundingActionModal
          row={acting.row}
          mode={acting.mode}
          onClose={() => setActing(null)}
          onDone={() => {
            setActing(null);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}

function FundingActionModal({ row, mode, onClose, onDone }: { row: FundingRow; mode: "approve" | "reject"; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(row.balance || 0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      if (mode === "approve") {
        if (amount <= 0) throw new Error("Enter an amount greater than zero.");
        await approveFunding(row.walletId, amount);
      } else {
        if (!reason.trim()) throw new Error("A rejection reason is required.");
        await rejectFunding(row.walletId, reason.trim());
      }
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
      setBusy(false);
    }
  }

  return (
    <PlatformModal
      title={`${mode === "approve" ? "Approve" : "Reject"} funding`}
      subtitle={`${row.walletName} · ${row.tenantName}`}
      onClose={onClose}
    >
      {err && <PlatformError message={err} />}
      {mode === "approve" ? (
        <div className="field">
          <label className="lbl">Amount to credit (₹)</label>
          <input className="inp" type="number" min={1} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
      ) : (
        <div className="field">
          <label className="lbl">Rejection reason</label>
          <input className="inp" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. proof of payment not attached" />
        </div>
      )}
      <button type="button" className={mode === "approve" ? "btn btn-brand btn-block" : "btn btn-dark btn-block"} disabled={busy} onClick={submit}>
        {busy ? "Working…" : mode === "approve" ? "Approve funding" : "Reject request"}
      </button>
    </PlatformModal>
  );
}

type TeamRow = { userId: string; name: string; email: string; role: string; status: string };

const roleLabel = (r: string) => r.replace(/^platform_/, "").replace(/_/g, " ");

export function TeamPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [managing, setManaging] = useState<TeamRow | null>(null);
  const [inviting, setInviting] = useState(false);
  const { data, error, loading } = useLoad(() => fetchPlatformTeam(), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "team", "write");
  const reload = () => setReloadKey((k) => k + 1);

  const columns: { key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (r) => roleLabel(String(r.role)) },
    { key: "status", label: "Status", render: (r) => <StatusTag status={String(r.status)} /> },
  ];
  if (canWrite) {
    columns.push({
      key: "manage",
      label: "",
      render: (r) => (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setManaging(r as unknown as TeamRow)}>Manage</button>
      ),
    });
  }

  return (
    <>
      <PlatformPageHeader
        title="Platform Users"
        subtitle="Internal ShelfMerch team and roles."
        actions={canWrite ? <button type="button" className="btn btn-brand btn-sm" onClick={() => setInviting(true)}>+ Invite</button> : null}
      />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && <DataTable empty="No platform users." rows={data as unknown as Record<string, unknown>[]} columns={columns} />}
      {inviting && <TeamInviteModal onClose={() => setInviting(false)} onDone={() => { setInviting(false); reload(); }} />}
      {managing && <TeamManageModal row={managing} onClose={() => setManaging(null)} onChanged={reload} />}
    </>
  );
}

function TeamInviteModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("platform_support_agent");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!name.trim() || !email.trim()) {
      setErr("Name and email are required.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await inviteTeamMember({ name: name.trim(), email: email.trim(), role });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not invite");
      setBusy(false);
    }
  }

  return (
    <PlatformModal title="Invite team member" onClose={onClose}>
      {err && <PlatformError message={err} />}
      <div className="field"><label className="lbl">Name</label><input className="inp" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="field"><label className="lbl">Email</label><input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="field">
        <label className="lbl">Role</label>
        <select className="inp" value={role} onChange={(e) => setRole(e.target.value)}>
          {PLATFORM_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </select>
      </div>
      <button type="button" className="btn btn-brand btn-block" disabled={busy} onClick={submit}>{busy ? "Inviting…" : "Send invite"}</button>
    </PlatformModal>
  );
}

function TeamManageModal({ row, onClose, onChanged }: { row: TeamRow; onClose: () => void; onChanged: () => void }) {
  const [role, setRole] = useState(row.role);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const isActive = row.status === "active";

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setErr("");
    setNote("");
    try {
      await fn();
      setNote(ok);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PlatformModal title={row.name} subtitle={row.email} onClose={onClose}>
      {err && <PlatformError message={err} />}
      {note && <div className="card" style={{ padding: 10, marginBottom: 12, color: "var(--brand)", fontSize: 13 }}>{note}</div>}
      <div className="field">
        <label className="lbl">Role</label>
        <select className="inp" value={role} onChange={(e) => setRole(e.target.value)}>
          {PLATFORM_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </select>
      </div>
      <button type="button" className="btn btn-soft btn-sm" disabled={busy || role === row.role}
        onClick={() => run(() => changeTeamRole(row.userId, role), "Role updated.")}>
        Save role
      </button>
      <div className="divider" style={{ margin: "18px 0" }} />
      {isActive ? (
        <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} disabled={busy}
          onClick={() => run(() => deactivateTeamMember(row.userId), "User deactivated.")}>
          Deactivate user
        </button>
      ) : (
        <button type="button" className="btn btn-soft btn-sm" disabled={busy}
          onClick={() => run(() => reactivateTeamMember(row.userId), "User reactivated.")}>
          Reactivate user
        </button>
      )}
    </PlatformModal>
  );
}

export function AuditPage() {
  const { data, error, loading } = useLoad(() => fetchAuditLogs(100));

  return (
    <>
      <PlatformPageHeader title="Audit Logs" subtitle="Immutable trail of platform actions." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <DataTable
          empty="No audit events."
          rows={data.items}
          columns={[
            { key: "action", label: "Action" },
            { key: "entityType", label: "Entity" },
            { key: "entityId", label: "ID", render: (r) => String(r.entityId).slice(-8) },
            {
              key: "createdAt",
              label: "When",
              render: (r) => new Date(String(r.createdAt)).toLocaleString("en-IN"),
            },
          ]}
        />
      )}
    </>
  );
}

export function SettingsPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<{ key: string; value: unknown } | null>(null);
  const { data, error, loading } = useLoad(() => fetchPlatformSettings(), [reloadKey]);
  const canWrite = canAccessArea(getStoredUser()?.role, "settings", "write");

  return (
    <>
      <PlatformPageHeader title="Settings" subtitle="Platform-wide configuration." />
      {loading && <PlatformLoading />}
      {error && <PlatformError message={error} />}
      {data && (
        <div className="card" style={{ padding: 16 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                {canWrite && <th></th>}
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([key, value]) => (
                <tr key={key}>
                  <td><code>{key}</code></td>
                  <td><code>{JSON.stringify(value)}</code></td>
                  {canWrite && (
                    <td style={{ textAlign: "right" }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing({ key, value })}>Edit</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <SettingEditModal
          settingKey={editing.key}
          initial={editing.value}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); setReloadKey((k) => k + 1); }}
        />
      )}
    </>
  );
}

function SettingEditModal({ settingKey, initial, onClose, onDone }: { settingKey: string; initial: unknown; onClose: () => void; onDone: () => void }) {
  const [text, setText] = useState(JSON.stringify(initial, null, 2));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    // Accept JSON (objects, numbers, booleans); fall back to a raw string.
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      value = text;
    }
    try {
      await updateSetting(settingKey, value);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save setting");
      setBusy(false);
    }
  }

  return (
    <PlatformModal title="Edit setting" subtitle={settingKey} onClose={onClose}>
      {err && <PlatformError message={err} />}
      <div className="field">
        <label className="lbl">Value (JSON)</label>
        <textarea className="inp" rows={6} value={text} onChange={(e) => setText(e.target.value)} style={{ fontFamily: "monospace", fontSize: 13 }} />
      </div>
      <button type="button" className="btn btn-brand btn-block" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Save setting"}</button>
    </PlatformModal>
  );
}

export function PlatformIndexRedirect() {
  return (
    <div className="muted">
      Redirecting… <Link to="/platform/dashboard">Go to dashboard</Link>
    </div>
  );
}
