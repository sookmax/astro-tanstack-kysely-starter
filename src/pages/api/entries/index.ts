import type { APIRoute } from "astro";
import { getEntries } from "@/lib/queries/getEntries";
import { insertEntry } from "@/lib/queries/insertEntry";
import { GetEntriesSearchParamsSchema } from "@/lib/schemas/getEntries.schema";
import { InsertEntryBodySchema } from "@/lib/schemas/insertEntry.schema";
import {
  AuthRequiredError,
  InvalidRequestBodyError,
  InvalidSearchParamsError,
} from "@/utils/error";
import { handleApiError } from "@/utils/handleApiError";

// GET /api/entries?cursor=&limit= — the public list, newest first.
export const GET: APIRoute = async ({ url, locals }) => {
  const params = GetEntriesSearchParamsSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  if (!params.success) return InvalidSearchParamsError.response();

  try {
    return Response.json(
      // identity comes from the session (locals), spread LAST so nothing in
      // the query string can override it
      await getEntries({ ...params.data, viewer_id: locals.user?.id ?? null }),
    );
  } catch (error) {
    return handleApiError(error);
  }
};

// POST /api/entries { body } — signed-in users only. The author is the session
// user; the request body carries content only.
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) return AuthRequiredError.response();

  const body = InsertEntryBodySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!body.success) return InvalidRequestBodyError.response();

  try {
    const result = await insertEntry({ ...body.data, user_id: locals.user.id });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
