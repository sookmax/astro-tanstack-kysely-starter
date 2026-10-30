import { QueryClient } from "@tanstack/react-query";

// Shared by the server options (query-server.ts → the DB) and the client
// options (query-client.ts → fetch the API). Both build their keys from here,
// so a cache the server filled is the cache the client reads.
//
// Deliberately not `as const`: the two entry lists then type as the same
// options (string[] keys), so one <EntryList> component takes either.
export const queryKeys = {
  user: ["user"],
  // every entry query sits under this prefix — invalidate it to refresh all
  entries: ["entries"],
  entryList: ["entries", "list"],
  myEntries: ["entries", "mine"],
  entry: (id: number) => ["entries", "detail", id],
};

export function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, data is fresh when it arrives; don't refetch it the moment
        // the client mounts.
        // https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
        staleTime: 60 * 1000,
        // Reads are suspense queries, which throw to the router's error
        // boundary on their own; nothing else should.
        throwOnError: false,
      },
      mutations: {
        // Mutation errors are shown inline where they happen.
        throwOnError: false,
      },
    },
  });
}
