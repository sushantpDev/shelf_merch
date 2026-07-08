/** Normalize Mongo ObjectId values that may arrive as strings or populated `{ _id }` refs. */
export function normalizeMongoId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in value) {
    return normalizeMongoId((value as { _id: unknown })._id);
  }
  return String(value);
}
