import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { importShopify, type ShopifyImportSummary, type ShopifyImportBreakdown } from "@/services/platform-api";
import { PlatformError, PlatformPageHeader } from "./platform-ui";

/** One side of the sorted import result: catalog products or kit bundles. */
function ImportGroup({
  label,
  hint,
  b,
  items,
}: {
  label: string;
  hint: string;
  b?: ShopifyImportBreakdown;
  items: { title: string; status: string }[];
}) {
  const total = (b?.imported ?? 0) + (b?.updated ?? 0) + (b?.skipped ?? 0);
  return (
    <div className="card" style={{ flex: "1 1 280px", minWidth: 260, padding: 14, background: "var(--surface-2)" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{label} <span className="muted" style={{ fontWeight: 500 }}>({total})</span></div>
        <div className="muted" style={{ fontSize: 11 }}>{hint}</div>
      </div>
      <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
        {b?.imported ?? 0} new · {b?.updated ?? 0} updated · {b?.skipped ?? 0} unchanged
      </div>
      {items.length > 0 && (
        <ul style={{ fontSize: 12.5, paddingLeft: 16, margin: 0, maxHeight: 160, overflow: "auto" }}>
          {items.slice(0, 30).map((i, n) => (
            <li key={n}>{i.title} <span className="muted">· {i.status}</span></li>
          ))}
          {items.length > 30 && <li className="muted">+{items.length - 30} more</li>}
        </ul>
      )}
    </div>
  );
}

export function ShopifyImport() {
  const navigate = useNavigate();
  const [domain, setDomain] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ShopifyImportSummary | null>(null);

  async function run() {
    setBusy(true);
    setError("");
    setSummary(null);
    try {
      setSummary(await importShopify(domain.trim(), token.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PlatformPageHeader
        title="Import from Shopify"
        subtitle="Pull products from a Shopify store into the catalog as drafts for review."
        actions={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate({ to: "/platform/catalog" })}>
            Back to catalog
          </button>
        }
      />

      {error && <PlatformError message={error} />}

      <div className="card" style={{ padding: 22, maxWidth: 620 }}>
        <div className="field">
          <label className="lbl">Store domain</label>
          <input
            className="inp"
            placeholder="xyz.myshopify.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={busy}
          />
        </div>
        <div className="field">
          <label className="lbl">Admin API access token</label>
          <input
            className="inp"
            type="password"
            placeholder="shpat_…"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={busy}
          />
          <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            Used once for this import and never stored. Imported products land as drafts — set cost, GST and HSN before publishing.
          </p>
        </div>
        <button type="button" className="btn btn-brand" disabled={busy || !domain || !token} onClick={run}>
          {busy ? "Importing…" : "Run import"}
        </button>
      </div>

      {summary && (
        <div className="card" style={{ padding: 22, maxWidth: 720, marginTop: 18 }}>
          <div className="row" style={{ gap: 24, marginBottom: 14 }}>
            <div><div className="muted" style={{ fontSize: 12 }}>Imported</div><div className="h1" style={{ fontSize: 22 }}>{summary.imported}</div></div>
            <div><div className="muted" style={{ fontSize: 12 }}>Updated</div><div className="h1" style={{ fontSize: 22 }}>{summary.updated}</div></div>
            <div><div className="muted" style={{ fontSize: 12 }}>Skipped</div><div className="h1" style={{ fontSize: 22 }}>{summary.skipped}</div></div>
            <div><div className="muted" style={{ fontSize: 12 }}>Failed</div><div className="h1" style={{ fontSize: 22 }}>{summary.failed}</div></div>
          </div>

          {/* Sorted into catalog products vs kit bundles. */}
          <div className="row" style={{ gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <ImportGroup
              label="Catalog products"
              hint="→ Catalog"
              b={summary.products}
              items={summary.items.filter((i) => i.kind !== "kit" && i.status !== "failed")}
            />
            <ImportGroup
              label="Kit bundles"
              hint="→ Kits (draft)"
              b={summary.kits}
              items={summary.items.filter((i) => i.kind === "kit" && i.status !== "failed")}
            />
          </div>

          {summary.kits && summary.kits.imported + summary.kits.updated > 0 && (
            <p className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
              Bundles were routed to <b>Kits</b> as drafts — open each kit to add its component products, then publish.
            </p>
          )}

          {summary.failed > 0 && (
            <ul style={{ color: "var(--danger)", fontSize: 13, paddingLeft: 18 }}>
              {summary.items.filter((i) => i.status === "failed").map((i, n) => (
                <li key={n}>{i.title}: {i.reason}</li>
              ))}
            </ul>
          )}
          <div className="row" style={{ gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => navigate({ to: "/platform/catalog" })}>
              View catalog
            </button>
            {summary.kits && summary.kits.imported + summary.kits.updated > 0 && (
              <button type="button" className="btn btn-soft btn-sm" onClick={() => navigate({ to: "/platform/kits" })}>
                View kits
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
