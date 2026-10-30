import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { queryKeys } from "./query-common";
import { fetchEntries } from "./fetch/fetchEntries";
import { fetchEntry } from "./fetch/fetchEntry";
import { authClient } from "./auth-client";
import { UserSchema } from "./schemas/user.schema";

// Browser twins of query-server.ts: same keys, the queryFn calls the API. The
// routes' beforeLoad and components use these; on a direct hit they're
// satisfied by the server-filled cache, on client navigation they fetch.
//
// Keep observer-only options (refetchOnWindowFocus, placeholderData, …) out of
// these: they're also passed to queryClient.query() in beforeLoad, which
// doesn't accept them. Add those at the useQuery call site instead.

export const fetchUserOptions = queryOptions({
  queryKey: queryKeys.user,
  queryFn: async () => {
    const { data } = await authClient.getSession();
    return data?.user ? UserSchema.decode(data.user) : null;
  },
});

export const fetchEntryListOptions = infiniteQueryOptions({
  queryKey: queryKeys.entryList,
  queryFn: ({ pageParam }) => fetchEntries({ cursor: pageParam }),
  initialPageParam: null as number | null,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

export const fetchMyEntriesOptions = infiniteQueryOptions({
  queryKey: queryKeys.myEntries,
  queryFn: ({ pageParam }) => fetchEntries({ cursor: pageParam, mine: true }),
  initialPageParam: null as number | null,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

export const fetchEntryOptions = (id: number) =>
  queryOptions({
    queryKey: queryKeys.entry(id),
    queryFn: () => fetchEntry(id),
  });
