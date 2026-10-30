import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { QueryClientProvider, noop } from "@tanstack/react-query";
import { useEffect } from "react";
import { ssrLoadingIndicator } from "@/utils/ssrLoadingIndicator";
import type { RouterContext } from "@/lib/schemas/routerContext.schema";
import { fetchUserOptions } from "@/lib/query-client";
import { AppLayout } from "../components/AppLayout";
import { DevTools } from "../components/DevTools";

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ context: { queryClient } }) => {
    // The `[user]` cache is never cold on the client: every page seeds it
    // (ReactServerEntry) before hydration, and Nav's useSuspenseQuery keeps it
    // subscribed so it's never garbage-collected. Child routes rely on that —
    // their auth gates read it synchronously with getQueryData.
    //
    // So this only refreshes it: on every navigation, a normal query()
    // refetches in the background once it's past its 60s staleTime (and is a
    // no-op while fresh). Never awaited — a stale user must not stall
    // navigation. query() rejects on failure (unlike the deprecated
    // prefetchQuery), so a fire-and-forget call needs its own catch. Server
    // APIs stay the authority, so a briefly stale user only affects which UI
    // shows, never what's allowed.
    void queryClient.query(fetchUserOptions).catch(noop);
  },
  component: RootLayout,
});

function RootLayout() {
  // The QueryClient comes from the router context: rebuilt on each side,
  // never serialized (a live QueryClient can't be).
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    ssrLoadingIndicator.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout>
        <Outlet />
      </AppLayout>
      <DevTools />
    </QueryClientProvider>
  );
}
