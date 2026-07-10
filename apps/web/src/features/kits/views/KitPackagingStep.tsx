import { Box } from "lucide-react";
import kitPackagingNone from "../../../../assets/kit-packaging-none.png";
import kitPackagingBox from "../../../../assets/kit-packaging-box.png";

type Pkg = "none" | "box";

/** Kit packaging step — choose mailer vs premium box. */
export function KitPackagingStep({
  kitName,
  packaging,
  onPackaging,
}: {
  kitName: string;
  itemCount?: number;
  packaging: Pkg;
  onPackaging: (pkg: Pkg) => void;
}) {
  return (
    <div className="kt-pkg-solo">
      <div className="card sw-name-main-card">
        <header className="sw-name-header">
          <div className="sw-name-title-row">
            <h1>Choose packaging</h1>
            <span className="tag tag-ready">Step 4 of 4</span>
          </div>
          <p className="muted sw-name-lead">
            How should &ldquo;{kitName}&rdquo; arrive? Premium packaging is charged per kit —
            recipients see the unboxing experience you choose.
          </p>
        </header>

        <div className="sw-name-body">
          <div className="kt-pkg-options">
            <PkgOption
              on={packaging === "none"}
              title="No packaging"
              desc="Items ship in standard protective mailers."
              price="Free"
              thumb={kitPackagingNone}
              onClick={() => onPackaging("none")}
            />
            <PkgOption
              on={packaging === "box"}
              title="Premium shipping box"
              desc="Branded rigid box with crinkle-paper fill."
              price="₹49 / kit"
              thumb={kitPackagingBox}
              onClick={() => onPackaging("box")}
            />
          </div>

          <div className="sw-name-tips">
            <div className="row sw-name-tips-head">
              <Box size={15} /> Reusable kit
            </div>
            <p className="kt-pkg-tip-copy">
              Once published, this kit is reusable — send it to new recipients any time without
              rebuilding.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PkgOption({
  on,
  title,
  desc,
  price,
  thumb,
  onClick,
}: {
  on: boolean;
  title: string;
  desc: string;
  price: string;
  thumb: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`kt-pkg-option ${on ? "on" : ""}`} onClick={onClick}>
      <div className="rd" />
      <div className="kt-pkg-option-thumb" aria-hidden>
        <img src={thumb} alt="" />
      </div>
      <div className="kt-pkg-option-copy">
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
      <b className="kt-pkg-option-price">{price}</b>
    </button>
  );
}
