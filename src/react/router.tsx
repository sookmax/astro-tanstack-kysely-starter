import { createRouter as createReactRouter } from "@tanstack/react-router";
import { dehydrate, hydrate } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { PageLoading } from "./components/PageLoading";
import { ErrorFallback } from "./components/ErrorFallback";
import {
  getInitialRouterContext,
  RouterContextSchema,
  type RouterContext,
} from "@/lib/schemas/routerContext.schema";

// Called on both sides with a different half of the context:
// - server (ReactServerEntry.astro): the page's filled `queryClient` →
//   dehydrate it into `dehydratedQueryState` for the HTML.
// - client (ReactClientEntry.tsx): `dehydratedQueryState` from the HTML →
//   hydrate it into a fresh client QueryClient.
export function createRouter(initialContext?: Partial<RouterContext>) {
  const context = RouterContextSchema.decode({
    ...getInitialRouterContext(),
    ...initialContext,
  });

  if (initialContext?.dehydratedQueryState) {
    hydrate(context.queryClient, initialContext.dehydratedQueryState);
  } else if (initialContext?.queryClient) {
    context.dehydratedQueryState = dehydrate(initialContext.queryClient);
  }

  return createReactRouter({
    routeTree,
    context,
    defaultPendingComponent: PageLoading,
    defaultErrorComponent: ErrorFallback,
    // A navigation whose beforeLoad awaits a fetch shows the pending overlay
    // only past 150ms, so quick loads (and cache hits) swap in without a
    // spinner flash; once shown, it stays at least 200ms.
    defaultPendingMs: 150,
    defaultPendingMinMs: 200,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
