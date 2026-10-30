import type { APIRoute } from "astro";
import { getEntry } from "@/lib/queries/getEntry";
import { deleteEntry } from "@/lib/queries/deleteEntry";
import { EntryIdSchema } from "@/lib/schemas/entryParams.schema";
import { AuthRequiredError, EntryNotFoundError } from "@/utils/error";
import { handleApiError } from "@/utils/handleApiError";

// GET /api/entries/:id
export const GET: APIRoute = async ({ params, locals }) => {
  const id = EntryIdSchema.safeParse(params.id);
  if (!id.success) return EntryNotFoundError.response();

  try {
    const entry = await getEntry({
      id: id.data,
      viewer_id: locals.user?.id ?? null,
    });
    return entry ? Response.json(entry) : EntryNotFoundError.response();
  } catch (error) {
    return handleApiError(error);
  }
};

// DELETE /api/entries/:id — the author only. Someone else's entry answers 404,
// like a missing one, so it reveals nothing.
export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) return AuthRequiredError.response();

  const id = EntryIdSchema.safeParse(params.id);
  if (!id.success) return EntryNotFoundError.response();

  try {
    const deleted = await deleteEntry({ id: id.data, user_id: locals.user.id });
    return deleted
      ? new Response(null, { status: 204 })
      : EntryNotFoundError.response();
  } catch (error) {
    return handleApiError(error);
  }
};
