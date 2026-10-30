import {
  InsertEntryResultSchema,
  type InsertEntryBody,
} from "@/lib/schemas/insertEntry.schema";
import { LikeEntryResultSchema } from "@/lib/schemas/likeEntry.schema";
import { AppError } from "@/utils/error";

export async function createEntry(body: InsertEntryBody) {
  const response = await fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await AppError.fromResponse(response);

  return InsertEntryResultSchema.parse(await response.json());
}

// A bodyless DELETE/POST still sends `Content-Type: application/json`: with no
// content type at all, Astro's `checkOrigin` CSRF guard treats the request like
// a form post and runs its same-origin check on it.
export async function deleteEntry(id: number) {
  const response = await fetch(`/api/entries/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw await AppError.fromResponse(response);
}

export async function setEntryLiked({
  id,
  liked,
}: {
  id: number;
  liked: boolean;
}) {
  const response = await fetch(`/api/entries/${id}/likes`, {
    method: liked ? "POST" : "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw await AppError.fromResponse(response);

  return LikeEntryResultSchema.parse(await response.json());
}
