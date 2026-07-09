import { ShelfMerchLogo } from "@/components/brand/ShelfMerchLogo";

type Props = {
  message?: string;
  fullScreen?: boolean;
};

export function LoadingState({ message = "Loading workspace…", fullScreen = true }: Props) {
  return (
    <div className={fullScreen ? "sm-loading-screen" : "sm-loading-inline"} role="status" aria-live="polite">
      <div className="sm-loading-panel">
        <div className="sm-loading-brand">
          <ShelfMerchLogo height={32} />
        </div>
        <div className="sm-loading-spinner" aria-hidden="true" />
        <p className="sm-loading-label">{message}</p>
      </div>
    </div>
  );
}

export function CatalogLoadingSkeleton() {
  return (
    <div className="sm-skeleton-grid" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="sm-skeleton-card">
          <div className="sm-skeleton-img" />
          <div className="sm-skeleton-line" />
          <div className="sm-skeleton-line short" />
        </div>
      ))}
    </div>
  );
}
