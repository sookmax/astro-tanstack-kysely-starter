import type { APIRoute } from "astro";
import { likeEntry, unlikeEntry } from "@/lib/queries/likeEntry";
import { EntryIdSchema } from "@/lib/schemas/entryParams.schema";
import { AuthRequiredError, EntryNotFoundError } from "@/utils/error";
import { handleApiError } from "@/utils/handleApiError";

// POST = like, DELETE = unlike. Both idempotent, both answer
// { entry_id, likes_count, is_liked }.
const toggle =
  (action: typeof likeEntry): APIRoute =>
  async ({ params, locals }) => {
    if (!locals.user) return AuthRequiredError.response();

    const id = EntryIdSchema.safeParse(params.id);
    if (!id.success) return EntryNotFoundError.response();

    try {
      return Response.json(
        await action({ entry_id: id.data, user_id: locals.user.id }),
      );
    } catch (error) {
      return handleApiError(error);
    }
  };

export const POST = toggle(likeEntry);
export const DELETE = toggle(unlikeEntry);
