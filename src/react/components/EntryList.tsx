import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import type { fetchEntryListOptions } from "@/lib/query-client";
import { EntryItem } from "./EntryItem";
import { Button } from "./Button";
import { Card } from "./Card";

type Props = {
  // either list's options (fetchEntryListOptions / fetchMyEntriesOptions) —
  // they share one type
  options: typeof fetchEntryListOptions;
  emptyText: string;
};

export function EntryList({ options, emptyText }: Props) {
  // Suspense: on a direct hit the server already filled this cache, so it
  // renders immediately (and identically) on both sides — no loading state.
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(options);

  const entries = data.pages.flatMap((page) => page.entries);

  if (entries.length === 0) {
    return <Card className="text-ink-muted">{emptyText}</Card>;
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {entries.map((entry) => (
          <li key={entry.id}>
            <EntryItem entry={entry} />
          </li>
        ))}
      </ul>
      {hasNextPage && (
        <Button
          className="self-center"
          onClick={() => void fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      )}
    </>
  );
}
