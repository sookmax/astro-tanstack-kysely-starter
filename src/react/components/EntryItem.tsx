import { useNavigate, useLocation } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { fetchUserOptions } from "@/lib/query-client";
import type { Entry } from "@/lib/schemas/entry.schema";
import { useDeleteEntry, useToggleLike } from "../hooks/useEntryMutations";
import { EntryCard } from "./EntryCard";

type Props = {
  entry: Entry;
  linkToEntry?: boolean;
  onDeleted?: () => Promise<void> | void;
};

// The container around EntryCard: wires likes and deletion to the API.
export function EntryItem({ entry, linkToEntry, onDeleted }: Props) {
  const { data: user } = useSuspenseQuery(fetchUserOptions);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const toggleLike = useToggleLike();
  const deleteEntry = useDeleteEntry({ onDeleted });

  return (
    <EntryCard
      entry={entry}
      linkToEntry={linkToEntry}
      onToggleLike={() => {
        // likes need an account; bring visitors back here after signing in
        if (!user) {
          void navigate({ to: "/sign-in", search: { redirect: pathname } });
          return;
        }
        toggleLike.mutate({ id: entry.id, liked: !entry.is_liked });
      }}
      onDelete={() => deleteEntry.mutate(entry.id)}
      deleting={deleteEntry.isPending}
    />
  );
}
