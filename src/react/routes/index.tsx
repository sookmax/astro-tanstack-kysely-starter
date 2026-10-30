import { createFileRoute } from "@tanstack/react-router";
import { fetchEntryListOptions } from "@/lib/query-client";
import { PageLayout } from "../components/PageLayout";
import { EntryList } from "../components/EntryList";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context: { queryClient } }) => {
    // Direct hit: index.astro already ran the SERVER twin of these options
    // (same key) and the cache came down with the HTML, so this resolves from
    // it without a request. Client navigation: a plain query() fetches when
    // the cache is missing or stale, and the router shows the pending
    // overlay meanwhile. It replaces the deprecated fetchInfiniteQuery.
    await queryClient.infiniteQuery(fetchEntryListOptions);
  },
  component: Home,
});

function Home() {
  return (
    <PageLayout>
      <h1 className="text-2xl font-bold">Guestbook</h1>
      <EntryList
        options={fetchEntryListOptions}
        emptyText="No entries yet. Be the first!"
      />
    </PageLayout>
  );
}
