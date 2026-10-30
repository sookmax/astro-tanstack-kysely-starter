import { createFileRoute, notFound } from "@tanstack/react-router";
import { noop, useSuspenseQuery } from "@tanstack/react-query";
import { fetchEntryOptions } from "@/lib/query-client";
import { EntryIdSchema } from "@/lib/schemas/entryParams.schema";
import { PageLayout } from "../../components/PageLayout";
import { EntryItem } from "../../components/EntryItem";

export const Route = createFileRoute("/entries/$id")({
  params: {
    // /entries/abc → not a number → the router's not-found handling
    parse: ({ id }) => ({ id: EntryIdSchema.parse(id) }),
    stringify: ({ id }) => ({ id: String(id) }),
  },
  beforeLoad: async ({ context: { queryClient }, params: { id } }) => {
    // Cached-now, refresh-in-background — the query() spelling of the
    // deprecated `ensureQueryData({ ...o, revalidateIfStale: true })`:
    // 1. `staleTime: "static"` returns any cached copy at once (an entry seen
    //    in a list moments ago), blocking only on a cold cache;
    const entry = await queryClient.query({
      ...fetchEntryOptions(id),
      staleTime: "static",
    });
    // 2. a normal query() then revalidates it if stale, unawaited.
    void queryClient.query(fetchEntryOptions(id)).catch(noop);

    // A missing entry usually never gets here — fetchEntry throws the API's
    // 404 as an AppError first, which ErrorFallback renders. This narrows the
    // type and covers a cached `null` from the server.
    if (!entry) throw notFound();
  },
  component: EntryPage,
});

function EntryPage() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const { data: entry } = useSuspenseQuery(fetchEntryOptions(id));

  return (
    <PageLayout>
      <EntryItem
        entry={entry}
        linkToEntry={false}
        onDeleted={() => navigate({ to: "/" })}
      />
    </PageLayout>
  );
}
