import "@/utils/server-module";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { queryKeys } from "./query-common";
import { getEntries } from "./queries/getEntries";
import { getEntry } from "./queries/getEntry";

// Server twins of query-client.ts: SAME keys, but the queryFn reads the DB
// directly (no HTTP hop). The .astro pages run these with the request's
// identity, the results are dehydrated into the HTML, and the client options'
// fetch-based queryFn never runs on the server — the cache is already filled.

export const getEntryListOptions = (viewer_id: string | null) =>
  infiniteQueryOptions({
    queryKey: queryKeys.entryList,
    queryFn: ({ pageParam }) => getEntries({ viewer_id, cursor: pageParam }),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

export const getMyEntriesOptions = (user_id: string) =>
  infiniteQueryOptions({
    queryKey: queryKeys.myEntries,
    queryFn: ({ pageParam }) =>
      getEntries({ viewer_id: user_id, author_id: user_id, cursor: pageParam }),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

export const getEntryOptions = (id: number, viewer_id: string | null) =>
  queryOptions({
    queryKey: queryKeys.entry(id),
    queryFn: () => getEntry({ id, viewer_id }),
  });
