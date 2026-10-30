import { lazy, Suspense } from "react";
import { useHydrated } from "../hooks/useHydrated";

// Dev only. `import.meta.env.PROD` is replaced with `true` in the production
// build, so the lazy imports are dead code and the devtools packages never
// reach either bundle (which is why they're devDependencies).
const RouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/react-router-devtools").then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    );

const QueryDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/react-query-devtools").then((m) => ({
        default: m.ReactQueryDevtools,
      })),
    );

export function DevTools() {
  // client-only, so the SSR markup never includes them (no hydration mismatch)
  const isClient = useHydrated();
  if (!isClient) return null;

  return (
    <Suspense fallback={null}>
      <RouterDevtools position="bottom-left" />
      <QueryDevtools buttonPosition="bottom-right" />
    </Suspense>
  );
}
