import { EntrySchema } from "@/lib/schemas/entry.schema";
import { AppError } from "@/utils/error";

// A missing entry is a 404 → a thrown AppError, which reaches the router's
// ErrorFallback (rendered as the 404 view).
export async function fetchEntry(id: number) {
  const response = await fetch(`/api/entries/${id}`);
  if (!response.ok) throw await AppError.fromResponse(response);

  return EntrySchema.parse(await response.json());
}
