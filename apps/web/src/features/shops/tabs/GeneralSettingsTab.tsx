import { useEffect, useMemo, useState } from "react";
import { CircleHelp } from "lucide-react";
import { toast } from "sonner";
import type { UiShop } from "@/services/mappers";
import { useUpdateShop } from "../model";

const SETTINGS_SECTIONS = [
  "General Settings",
  "Swag Settings",
  "SEO",
  "Integrations",
  "Link & Privacy",
  "Customizations",
  "Shop Users",
] as const;

type CurrencyMode = "points" | "inr" | "priceless";

function currencyHelper(mode: CurrencyMode) {
  if (mode === "points") {
    return {
      label: "(Short name: Pts, Conversion 1 USD = 50 Pts)",
      note: "Currency can't be changed once an order has been started. You can duplicate your shop and apply a different currency if needed.",
    };
  }
  if (mode === "inr") {
    return {
      label: "Prices will be shown in rupees on the storefront.",
      note: "Currency can't be changed once an order has been started. You can duplicate your shop and apply a different currency if needed.",
    };
  }
  return {
    label: "Recipients will see gift-style listings without visible prices.",
    note: "Currency can't be changed once an order has been started. You can duplicate your shop and apply a different currency if needed.",
  };
}

export function GeneralSettingsTab({ shop }: { shop: UiShop }) {
  const updateShop = useUpdateShop();
  const [name, setName] = useState(shop.name);
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>(shop.currencyMode);
  const [pointsConversionEnabled, setPointsConversionEnabled] = useState(shop.pointsConversionEnabled);

  useEffect(() => {
    setName(shop.name);
    setCurrencyMode(shop.currencyMode);
    setPointsConversionEnabled(shop.pointsConversionEnabled);
  }, [shop]);

  const helper = useMemo(() => currencyHelper(currencyMode), [currencyMode]);
  const dirty =
    name.trim() !== shop.name ||
    currencyMode !== shop.currencyMode ||
    pointsConversionEnabled !== shop.pointsConversionEnabled;

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Shop name is required");
      return;
    }
    try {
      await updateShop.mutateAsync({
        shopId: shop.id,
        input: {
          name: trimmed,
          currencyMode,
          pointsConversionEnabled,
        },
      });
      toast.success("Shop settings updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    }
  }

  return (
    <div
      className="card"
      style={{
        padding: 24,
        display: "grid",
        gridTemplateColumns: "220px minmax(0, 1fr)",
        gap: 28,
        alignItems: "start",
      }}
    >
      <div
        style={{
          borderRight: "1px solid var(--line)",
          paddingRight: 18,
        }}
      >
        {SETTINGS_SECTIONS.map((section) => {
          const active = section === "General Settings";
          return (
            <div
              key={section}
              style={{
                padding: "11px 14px",
                borderRadius: 10,
                marginBottom: 6,
                fontSize: 12,
                fontWeight: active ? 700 : 600,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                color: active ? "var(--ink)" : "var(--ink-3)",
                background: active ? "var(--surface-2)" : "transparent",
              }}
            >
              {section}
            </div>
          );
        })}
      </div>

      <div style={{ maxWidth: 560 }}>
        <h3 style={{ fontSize: 28, marginBottom: 26 }}>General Settings</h3>

        <div className="field">
          <label className="lbl">Shop Name</label>
          <input className="inp" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="field">
          <label className="lbl">Display Price As</label>
          <select
            className="inp"
            value={currencyMode}
            onChange={(e) => setCurrencyMode(e.target.value as CurrencyMode)}
          >
            <option value="points">Points</option>
            <option value="inr">INR</option>
            <option value="priceless">Priceless</option>
          </select>
          <div className="muted" style={{ fontSize: 11, marginTop: 8, lineHeight: 1.55 }}>
            {helper.label}
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 4, lineHeight: 1.55 }}>
            {helper.note}
          </div>
        </div>

        <div className="field" style={{ marginTop: 26, marginBottom: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
            }}
          >
            <div>
              <div
                className="lbl"
                style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}
              >
                Points Conversion <CircleHelp size={14} />
              </div>
              <div style={{ color: "var(--ink-2)" }}>
                Allow recipients to convert shop points into Shelf Merch Points
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pointsConversionEnabled}
              className={`switch ${pointsConversionEnabled ? "on" : ""}`}
              onClick={() => setPointsConversionEnabled((value) => !value)}
            />
          </div>
        </div>

        <button
          type="button"
          className="btn btn-brand"
          disabled={!dirty || updateShop.isPending}
          onClick={save}
        >
          {updateShop.isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
