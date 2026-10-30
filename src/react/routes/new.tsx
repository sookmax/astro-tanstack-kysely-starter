import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-common";
import { createEntry } from "@/lib/fetch/mutateEntries";
import type { User } from "@/lib/schemas/user.schema";
import { getErrorMessage } from "@/utils/error";
import { PageLayout } from "../components/PageLayout";
import { EntryComposer } from "../components/EntryComposer";

export const Route = createFileRoute("/new")({
  // Auth gate, client-navigation half. new.astro does the same for a direct
  // hit; the API route re-checks either way (401).
  beforeLoad: ({ context: { queryClient }, location }) => {
    const user = queryClient.getQueryData<User | null>(queryKeys.user);
    if (!user) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.pathname },
      });
    }
  },
  component: NewEntry,
});

function NewEntry() {
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createEntry,
    onSuccess: async ({ id }) => {
      // the lists are stale now; they refetch the next time they're shown
      await queryClient.invalidateQueries({ queryKey: queryKeys.entries });
      await navigate({ to: "/entries/$id", params: { id } });
    },
  });

  return (
    <PageLayout>
      <EntryComposer
        onSubmit={(body) => create.mutate({ body })}
        pending={create.isPending}
        error={create.isError ? getErrorMessage(create.error) : null}
      />
    </PageLayout>
  );
}
