/** Link target for a designed product detail page. */
export function swagProductPath(collectionId: string, pIdx: number) {
  return `/app/swag/${encodeURIComponent(collectionId)}/${pIdx}`;
}
