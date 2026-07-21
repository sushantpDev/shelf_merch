/** Link target for a designed product detail page. */
export function swagProductPath(collectionId: string, pIdx: number) {
  return `/app/swag/${encodeURIComponent(collectionId)}/${pIdx}`;
}

/** Resume editing an existing draft collection in the design wizard. */
export function swagEditDraftPath(collectionId: string) {
  return `/app/swag/new?edit=${encodeURIComponent(collectionId)}`;
}
