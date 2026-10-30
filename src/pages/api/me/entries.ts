import type { APIRoute } from "astro";
import { getEntries } from "@/lib/queries/getEntries";
import { GetEntriesSearchParamsSchema } from "@/lib/schemas/getEntries.schema";
import { AuthRequiredError, InvalidSearchParamsError } from "@/utils/error";
import { handleApiError } from "@/utils/handleApiError";

// GET /api/me/entries?cursor=&limit= — the signed-in user's own entries.
export const GET: APIRoute = async ({ url, locals }) => {
  if (!locals.user) return AuthRequiredError.response();

  const params = GetEntriesSearchParamsSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  if (!params.success) return InvalidSearchParamsError.response();

  try {
    return Response.json(
      await getEntries({
        ...params.data,
        // from the session, after the URL's params — an `?author_id=` can't
        // list someone else's entries
        viewer_id: locals.user.id,
        author_id: locals.user.id,
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
};
