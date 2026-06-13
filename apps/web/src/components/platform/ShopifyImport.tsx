import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { importShopify, type ShopifyImportSummary } from "@/services/platform-api";
import { PlatformError, PlatformPageHeader } from "./platform-ui";

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
        <div className="card" style={{ padding: 22, maxWidth: 620, marginTop: 18 }}>
          <div className="row" style={{ gap: 24, marginBottom: 14 }}>
            <div><div className="muted" style={{ fontSize: 12 }}>Imported</div><div className="h1" style={{ fontSize: 22 }}>{summary.imported}</div></div>
            <div><div className="muted" style={{ fontSize: 12 }}>Skipped</div><div className="h1" style={{ fontSize: 22 }}>{summary.skipped}</div></div>
            <div><div className="muted" style={{ fontSize: 12 }}>Failed</div><div className="h1" style={{ fontSize: 22 }}>{summary.failed}</div></div>
          </div>
          {summary.failed > 0 && (
            <ul style={{ color: "var(--danger)", fontSize: 13, paddingLeft: 18 }}>
              {summary.items.filter((i) => i.status === "failed").map((i, n) => (
                <li key={n}>{i.title}: {i.reason}</li>
              ))}
            </ul>
          )}
          <button type="button" className="btn btn-soft btn-sm" style={{ marginTop: 8 }} onClick={() => navigate({ to: "/platform/catalog" })}>
            View catalog
          </button>
        </div>
      )}
    </>
  );
}
