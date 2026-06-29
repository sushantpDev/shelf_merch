function Logo() {
  return (
    <svg viewBox="0 0 32 32" fill="none" width={28} height={28} aria-hidden="true">
      <path d="M16 3 4 9l12 6 12-6-12-6Z" fill="#15784C" />
      <path d="M4 15l12 6 12-6" stroke="#0E5536" strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M4 21l12 6 12-6" stroke="#1E8E5C" strokeWidth={2.4} strokeLinejoin="round" />
    </svg>
  );
}

const CHIPS = ["Branded shops", "Points wallets", "Swag designer", "Kits at scale", "HRIS sync"];

/** Left-hand branding panel shared by the login & signup screens. */
export function AuthArt() {
  return (
    <div className="auth-art dotted">
      <div className="brandmark">
        <Logo />
        <span style={{ fontFamily: "var(--disp)", fontWeight: 800, fontSize: 20, color: "#fff" }}>
          Shelf Merch
        </span>
      </div>
      <div>
        <div className="big">Corporate swag &amp; gifting, on autopilot.</div>
        <div className="sub">
          Build branded stores, load wallets, design swag and send points to your team — all in one
          workspace, billed in ₹ with GST &amp; Razorpay.
        </div>
        <div className="chiprow">
          {CHIPS.map((c) => (
            <span key={c} className="chip">
              {c}
            </span>
          ))}
        </div>
      </div>
      <div style={{ opacity: 0.7, fontSize: 12.5 }}>Trusted by people teams · Made in India 🇮🇳</div>
    </div>
  );
}
