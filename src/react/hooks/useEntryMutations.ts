import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-common";
import { deleteEntry, setEntryLiked } from "@/lib/fetch/mutateEntries";
import type { Entry } from "@/lib/schemas/entry.schema";
import type { GetEntriesResult } from "@/lib/schemas/getEntries.schema";

type EntryCacheData = Entry | null | InfiniteData<GetEntriesResult>;

// One entry can sit in several caches at once — the home list, "my entries"
// and its detail page — all under the `["entries"]` prefix. Patch it wherever
// it is, whatever the shape of the cache holding it.
function patchEntry(
  queryClient: QueryClient,
  id: number,
  patch: (entry: Entry) => Entry,
) {
  queryClient.setQueriesData<EntryCacheData>(
    { queryKey: queryKeys.entries },
    (data) => {
      if (!data) return data;
      if ("pages" in data) {
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            entries: page.entries.map((e) => (e.id === id ? patch(e) : e)),
          })),
        };
      }
      return data.id === id ? patch(data) : data;
    },
  );
}

// Likes are optimistic: flip the heart and the count at once, roll back on
// error, and reconcile with the server's authoritative count on success (which
// also folds in other people's likes). Unlike creating or deleting, a like
// doesn't refetch anything — it toggles too often for that.
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setEntryLiked,
    onMutate: async ({ id, liked }) => {
      // an in-flight refetch would overwrite the optimistic state when it lands
      await queryClient.cancelQueries({ queryKey: queryKeys.entries });
      const snapshot = queryClient.getQueriesData<EntryCacheData>({
        queryKey: queryKeys.entries,
      });
      patchEntry(queryClient, id, (entry) => ({
        ...entry,
        is_liked: liked,
        likes_count: entry.likes_count + (liked ? 1 : -1),
      }));
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      for (const [queryKey, data] of context?.snapshot ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSuccess: (result) => {
      patchEntry(queryClient, result.entry_id, (entry) => ({
        ...entry,
        is_liked: result.is_liked,
        likes_count: result.likes_count,
      }));
    },
  });
}

export function useDeleteEntry({
  onDeleted,
}: {
  /** e.g. navigate away from the deleted entry's page */
  onDeleted?: () => Promise<void> | void;
} = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEntry,
    onSuccess: async (_result, id) => {
      // Leave first: while the detail page is still mounted, invalidating its
      // query would refetch the deleted entry → 404 → the error page.
      await onDeleted?.();
      queryClient.removeQueries({ queryKey: queryKeys.entry(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.entries });
    },
  });
}
