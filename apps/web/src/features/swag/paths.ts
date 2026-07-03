/** Link target for a designed product detail page. */
export function swagProductPath(collectionId: string, pIdx: number) {
  return {
    to: "/app/swag/$collectionId/$pIdx" as const,
    params: { collectionId, pIdx: String(pIdx) },
  };
}
