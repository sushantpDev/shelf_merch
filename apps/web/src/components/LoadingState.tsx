type Props = {
  message?: string;
  fullScreen?: boolean;
};

function ShelfMerchMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" width={28} height={28} aria-hidden="true">
      <path d="M16 3 4 9l12 6 12-6-12-6Z" fill="#15784C" />
      <path d="M4 15l12 6 12-6" stroke="#0E5536" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M4 21l12 6 12-6" stroke="#1E8E5C" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}

export function LoadingState({ message = "Loading workspace…", fullScreen = true }: Props) {
  return (
    <div className={fullScreen ? "sm-loading-screen" : "sm-loading-inline"} role="status" aria-live="polite">
      <div className="sm-loading-panel">
        <div className="sm-loading-brand">
          <ShelfMerchMark />
          <span>Shelf Merch</span>
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
