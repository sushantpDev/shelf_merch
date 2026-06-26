import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Full-screen overlay for wizards. Rendered via a portal to <body> so it is not
 * trapped inside the tenant layout's `.wrap.fade-in`, whose `rise` animation
 * applies a `transform` — a transformed ancestor becomes the containing block
 * for `position: fixed`, which would otherwise collapse the overlay inside the
 * content column instead of covering the viewport.
 */
export function FullscreenOverlay({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return createPortal(
    <div className="sm-fullscreen" style={style}>
      {children}
    </div>,
    document.body,
  );
}
