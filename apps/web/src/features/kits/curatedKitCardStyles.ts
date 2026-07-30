import type { CSSProperties } from "react";

/** Shared action-button styles for curated kit cards (KitsView + PreDesignedKits). */
export const curatedPreviewBtnStyle: CSSProperties = {
  flex: 1,
  border: "1px solid var(--line)",
  height: 32,
  fontSize: 13,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 6,
  color: "var(--ink)",
  background: "transparent",
  cursor: "pointer",
};

export const curatedSendBtnStyle: CSSProperties = {
  flex: 1,
  height: 32,
  fontSize: 13,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 6,
};
