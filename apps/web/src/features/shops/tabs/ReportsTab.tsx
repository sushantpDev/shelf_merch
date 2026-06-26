const STATS: [string, string][] = [
  ["Points sent", "74,221"],
  ["Points redeemed", "38,540"],
  ["Redemption rate", "52%"],
  ["Recipients", "100"],
];

const BARS = [28, 42, 35, 60, 48, 72, 64, 80];

export function ReportsTab() {
  const max = Math.max(...BARS);
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 18 }}>
        {STATS.map(([k, v]) => (
          <div key={k} className="card stat">
            <div className="k">{k}</div>
            <div className="v num">{v}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 22 }}>
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Redemptions over time</h3>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            height: 160,
            padding: "0 4px",
          }}
          role="img"
          aria-label="Redemptions over time bar chart"
        >
          {BARS.map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${(h / max) * 100}%`,
                background: "linear-gradient(180deg,#1E8E5C,#15784C)",
                borderRadius: "6px 6px 0 0",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
