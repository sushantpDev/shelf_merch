import { useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { UiContact } from "@/services/mappers";
import type { SendMode, SingleLocation } from "./types";

const MODE_CARDS: Array<[SendMode, string, string]> = [
  [
    "redeem",
    "Recipients redeem",
    "Recipients choose size, colour & shipping address from a private link.",
  ],
  [
    "surprise",
    "Surprise recipients",
    "Enter recipient details up front so gifts ship without input.",
  ],
  ["single", "Single location", "Ship all units to one office, event venue or address."],
];

/** Shared recipient picker (Send Items + Send Points). */
export function RecipientPicker({
  title,
  subtitle,
  contacts,
  selected,
  onToggle,
  onDeselectAll,
  showModes = false,
  mode = "redeem",
  onMode,
  singleLocation,
  onSingleLocationChange,
}: {
  title: string;
  subtitle: string;
  contacts: UiContact[];
  selected: string[];
  onToggle: (id: string) => void;
  onDeselectAll: () => void;
  showModes?: boolean;
  mode?: SendMode;
  onMode?: (mode: SendMode) => void;
  singleLocation?: SingleLocation;
  onSingleLocationChange?: (key: keyof SingleLocation, value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = q
    ? contacts.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    : contacts;

  const loc = singleLocation;

  return (
    <>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>{title}</h1>
      <p className="muted" style={{ marginBottom: 18 }}>
        {subtitle}
      </p>

      {showModes && onMode && (
        <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 18 }}>
          {MODE_CARDS.map(([key, t, d]) => (
            <button
              key={key}
              type="button"
              className={`optcard ${mode === key ? "on" : ""}`}
              onClick={() => onMode(key)}
            >
              <div className="rd" />
              <div>
                <h4>{t}</h4>
                <p>{d}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showModes && mode === "single" && loc && onSingleLocationChange && (
        <div className="card" style={{ padding: 20, marginBottom: 18 }}>
          <h3 style={{ fontSize: 16, marginBottom: 5 }}>Single delivery location</h3>
          <p className="muted" style={{ fontSize: 12.5, marginBottom: 16 }}>
            All selected recipients' gifts will ship together to this address. A notification will
            be sent to the email below.
          </p>
          <div className="row">
            <LocField label="Contact name" k="name" loc={loc} onChange={onSingleLocationChange} />
            <LocField
              label="Notification email"
              k="email"
              type="email"
              loc={loc}
              onChange={onSingleLocationChange}
            />
            <LocField
              label="Phone (optional)"
              k="phone"
              loc={loc}
              onChange={onSingleLocationChange}
            />
          </div>
          <LocField label="Address" k="line1" loc={loc} onChange={onSingleLocationChange} block />
          <LocField
            label="Address line 2 (optional)"
            k="line2"
            loc={loc}
            onChange={onSingleLocationChange}
            block
          />
          <div className="row">
            <LocField label="City" k="city" loc={loc} onChange={onSingleLocationChange} />
            <LocField label="State" k="state" loc={loc} onChange={onSingleLocationChange} />
            <LocField
              label="PIN / Postal code"
              k="pincode"
              loc={loc}
              onChange={onSingleLocationChange}
            />
            <div className="field" style={{ flex: 1 }}>
              <label className="lbl">Country</label>
              <select
                className="inp"
                value={loc.country || "IN"}
                onChange={(e) => onSingleLocationChange("country", e.target.value)}
              >
                <option value="IN">India</option>
                <option value="AE">UAE</option>
                <option value="US">USA</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 16 }}>
        <div className="row" style={{ gap: 8, marginBottom: 12, alignItems: "center" }}>
          <span
            className="tag tag-soft"
            style={{ background: "var(--brand-50)", color: "var(--brand-d)" }}
          >
            {selected.length} selected
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDeselectAll}>
            Deselect all
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => toast("Paste emails")}
          >
            Input emails
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => toast("Upload CSV")}
          >
            Add by CSV
          </button>
          <div className="search" style={{ flex: 1 }}>
            <Search size={16} aria-hidden="true" />
            <input
              style={{ height: 36 }}
              placeholder="Search by name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search recipients"
            />
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th />
              <th>Email</th>
              <th>Name</th>
              <th>Home address</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const on = selected.includes(c.id);
              return (
                <tr key={c.id}>
                  <td>
                    <button
                      type="button"
                      aria-pressed={on}
                      aria-label={`${on ? "Deselect" : "Select"} ${c.name}`}
                      onClick={() => onToggle(c.id)}
                      style={{
                        width: 18,
                        height: 18,
                        border: `2px solid ${on ? "var(--brand)" : "#c4ccc6"}`,
                        borderRadius: 4,
                        display: "grid",
                        placeItems: "center",
                        background: on ? "var(--brand)" : "#fff",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {on && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                    </button>
                  </td>
                  <td className="muted">{c.email}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td className="muted">{c.loc || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function LocField({
  label,
  k,
  loc,
  onChange,
  type = "text",
  block = false,
}: {
  label: string;
  k: keyof SingleLocation;
  loc: SingleLocation;
  onChange: (key: keyof SingleLocation, value: string) => void;
  type?: string;
  block?: boolean;
}) {
  return (
    <div className="field" style={block ? undefined : { flex: 1 }}>
      <label className="lbl">{label}</label>
      <input
        className="inp"
        type={type}
        value={loc[k] || ""}
        onChange={(e) => onChange(k, e.target.value)}
      />
    </div>
  );
}
