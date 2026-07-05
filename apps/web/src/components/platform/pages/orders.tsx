import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
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
} from "../platform-ui";
import { useLoad } from "../useLoad";

export function OrdersPage() {
  const { data, error, loading } = useLoad(() => fetchPlatformOrders({ limit: 100 }), []);

  const columns: {
    key: string;
    label: string;
    render?: (row: Record<string, unknown>) => ReactNode;
  }[] = [
    {
      key: "orderNumber",
      label: "Order #",
      render: (r) => (
        <Link
          to={`/platform/orders/${String(r._id)}`}
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
    {
      key: "createdAt",
      label: "Created",
      render: (r) => new Date(String(r.createdAt)).toLocaleDateString("en-IN"),
    },
    {
      key: "open",
      label: "",
      render: (r) => (
        <Link to={`/platform/orders/${String(r._id)}`} className="btn btn-ghost btn-sm">
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

function matchVariantHex(
  product: OrderItemProduct | null | undefined,
  variant?: { size?: string; color?: string },
) {
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
            // Match Konva's top-left rotation origin so the editor and this
            // preview show the print area at the same angle.
            transform: a.rotationDeg ? `rotate(${a.rotationDeg}deg)` : undefined,
            transformOrigin: "top left",
            border: resolvedArtwork
              ? "1px solid rgba(46,160,103,.5)"
              : "2px dashed rgba(46,160,103,.7)",
            background: resolvedArtwork ? "transparent" : "rgba(46,160,103,.1)",
            boxSizing: "border-box",
            pointerEvents: "none",
            display: "grid",
            placeItems: "center",
          }}
        >
          {resolvedArtwork && (
            <img
              src={resolvedArtwork}
              alt="Artwork"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
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
function FulfillmentTile({
  label,
  children,
  footer,
}: {
  label: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div>
      <div className="lbl" style={{ marginBottom: 6, fontSize: 10.5, letterSpacing: ".05em" }}>
        {label}
      </div>
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
                {a.maxWidthCm || a.maxHeightCm
                  ? `${a.maxWidthCm ?? "—"}×${a.maxHeightCm ?? "—"} cm`
                  : "—"}
              </td>
              <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                {a.dpi ?? "—"}
              </td>
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
    fetchPlatformVendors()
      .then(setVendors)
      .catch(() => setVendors([]));
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
      <div className="h1" style={{ fontSize: 16, marginBottom: 16 }}>
        Fulfillment actions
      </div>
      {err && <PlatformError message={err} />}
      {okNote && (
        <div
          className="card"
          style={{ padding: 10, marginBottom: 12, color: "var(--brand)", fontSize: 13 }}
        >
          {okNote}
        </div>
      )}

      <div className="field">
        <label className="lbl">Status</label>
        <select className="inp" value={status} onChange={(e) => setStatus(e.target.value)}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
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
        onClick={() =>
          run(() => setOrderStatus(id, status, statusNote || undefined), "Status updated.")
        }
      >
        Save status
      </button>

      <div className="divider" style={{ margin: "18px 0" }} />
      <div className="field">
        <label className="lbl">Assign production vendor</label>
        <select className="inp" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
          <option value="">Select a vendor…</option>
          {vendors.map((v) => (
            <option key={v._id} value={v._id}>
              {v.name}
            </option>
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
        onClick={() =>
          run(() => createOrderReplacement(id, replacementReason.trim()), "Replacement created.")
        }
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
  const recipient = data?.recipient as
    | { name?: string; email?: string; phone?: string }
    | undefined;
  const shipping = data?.shippingAddress as
    | {
        name?: string;
        phone?: string;
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        pincode?: string;
      }
    | undefined;
  const breakdown = data?.amountBreakdown as
    | { total?: number; subtotal?: number; gst?: number }
    | undefined;
  const items = (data?.items as OrderItem[] | undefined) ?? [];
  const mockupUrl = String(data?.mockupUrl ?? "");
  const internalNotes =
    (data?.internalNotes as Array<{ body: string; at: string }> | undefined) ?? [];
  const statusHistory =
    (data?.statusHistory as Array<{ status: string; at: string; note?: string }> | undefined) ?? [];

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
                <div className="h1" style={{ fontSize: 16, marginBottom: 16 }}>
                  Order summary
                </div>
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
                    <div className="h1" style={{ fontSize: 14, marginBottom: 12 }}>
                      Recipient &amp; shipping
                    </div>
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
                          {[shipping.city, shipping.state, shipping.pincode]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                        {shipping.phone && <div>{shipping.phone}</div>}
                      </div>
                    )}
                  </>
                )}

                {mockupUrl && (
                  <>
                    <div className="divider" style={{ margin: "18px 0" }} />
                    <div className="lbl" style={{ marginBottom: 8 }}>
                      Order mockup
                    </div>
                    <img
                      src={mockupUrl}
                      alt="Order mockup"
                      style={{
                        maxWidth: 280,
                        maxHeight: 280,
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                      }}
                    />
                  </>
                )}
              </div>

              <div className="h1" style={{ fontSize: 16, marginBottom: 16 }}>
                Production line items{" "}
                <span className="muted" style={{ fontWeight: 400 }}>
                  ({items.length})
                </span>
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
                  <div
                    key={idx}
                    className="card"
                    style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}
                  >
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
                          <span
                            style={{
                              width: 11,
                              height: 11,
                              borderRadius: 3,
                              background: tintHex,
                              border: "1px solid rgba(0,0,0,.2)",
                            }}
                          />
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
                                onClick={() =>
                                  downloadArtwork(artworkUrl, `${item.sku || "artwork"}-design`)
                                }
                              >
                                ↓ Download
                              </button>
                            }
                          >
                            <img
                              src={artworkUrl}
                              alt="Artwork"
                              style={{ maxWidth: "82%", maxHeight: "82%", objectFit: "contain" }}
                            />
                          </FulfillmentTile>
                        )}
                        <FulfillmentTile label="Base — production">
                          {baseImg ? (
                            <img
                              src={baseImg}
                              alt="Base"
                              style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            />
                          ) : (
                            <span className="mut3" style={{ fontSize: 12 }}>
                              Not available
                            </span>
                          )}
                        </FulfillmentTile>
                        <FulfillmentTile label="Mask — tinted">
                          <TintedGarment
                            src={product?.maskImageUrl}
                            hex={tintHex}
                            alt={`${variant?.color ?? "Garment"} mask`}
                          />
                        </FulfillmentTile>
                        {printAreas.length > 0 && mockup && (
                          <div>
                            <div
                              className="lbl"
                              style={{ marginBottom: 6, fontSize: 10.5, letterSpacing: ".05em" }}
                            >
                              {artworkUrl ? "Reference mockup" : "Print areas"}
                            </div>
                            <PrintAreaPreview
                              mockup={mockup}
                              areas={printAreas}
                              tintHex={tintHex}
                              artworkUrl={artworkUrl || undefined}
                            />
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
                      <div className="h1" style={{ fontSize: 14, marginBottom: 12 }}>
                        Status timeline
                      </div>
                      <ul
                        style={{
                          paddingLeft: 18,
                          fontSize: 13,
                          color: "var(--ink-2)",
                          margin: "0 0 16px",
                        }}
                      >
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
                      <div className="h1" style={{ fontSize: 14, marginBottom: 12 }}>
                        Internal notes
                      </div>
                      <ul
                        style={{ paddingLeft: 18, fontSize: 13, color: "var(--ink-2)", margin: 0 }}
                      >
                        {internalNotes.map((n, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            {n.body}
                            <span className="muted">
                              {" "}
                              · {new Date(n.at).toLocaleString("en-IN")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>

            {canWrite && <OrderFulfillmentActions order={data} onChanged={reload} />}
          </div>
        </>
      )}
    </>
  );
}
