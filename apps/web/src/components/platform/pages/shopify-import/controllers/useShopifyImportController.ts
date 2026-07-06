import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { importShopify, importShopifyKits, type ShopifyImportSummary } from "../model";

export type ShopifyImportVm = {
  kits: boolean;
  domain: string;
  token: string;
  busy: boolean;
  error: string;
  summary: ShopifyImportSummary | null;
  onBack: () => void;
  onDomain: (domain: string) => void;
  onToken: (token: string) => void;
  onRun: () => void;
  onViewResults: () => void;
};

/** Controller for the Shopify import page (catalog or kits). */
export function useShopifyImportController(): ShopifyImportVm {
  const navigate = useNavigate();
  const location = useLocation();
  const kits = location.pathname.includes("/kits/import");
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
      setSummary(await (kits ? importShopifyKits : importShopify)(domain.trim(), token.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return {
    kits,
    domain,
    token,
    busy,
    error,
    summary,
    onBack: () => navigate(kits ? "/platform/kits" : "/platform/catalog"),
    onDomain: setDomain,
    onToken: setToken,
    onRun: run,
    onViewResults: () => navigate(kits ? "/platform/kits" : "/platform/catalog"),
  };
}
