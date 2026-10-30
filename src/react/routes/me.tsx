import { createFileRoute, redirect } from "@tanstack/react-router";
import { queryKeys } from "@/lib/query-common";
import { fetchMyEntriesOptions } from "@/lib/query-client";
import type { User } from "@/lib/schemas/user.schema";
import { PageLayout } from "../components/PageLayout";
import { EntryList } from "../components/EntryList";

export const Route = createFileRoute("/me")({
  beforeLoad: async ({ context: { queryClient }, location }) => {
    // auth gate (client navigation) — me.astro mirrors it for a direct hit
    const user = queryClient.getQueryData<User | null>(queryKeys.user);
    if (!user) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.pathname },
      });
    }

    await queryClient.infiniteQuery(fetchMyEntriesOptions);
  },
  component: MyEntries,
});

function MyEntries() {
  return (
    <PageLayout>
      <h1 className="text-2xl font-bold">My entries</h1>
      <EntryList
        options={fetchMyEntriesOptions}
        emptyText="You haven't signed the guestbook yet."
      />
    </PageLayout>
  );
}
