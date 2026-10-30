// Any origin works as the parse base: only "did it stay on this origin?" matters.
const BASE = "https://same-origin.invalid";

/**
 * Sanitize a `?redirect=` target down to a same-origin path (+ search + hash).
 *
 * Resolves the target with the WHATWG URL parser — the one the browser uses to
 * follow the redirect — and falls back unless it stays on our origin. A string
 * prefix check isn't enough: the parser strips tabs/newlines and treats `\`
 * like `/`, so `/<TAB>/evil.com` passes "starts with / but not //" yet
 * resolves to `//evil.com`. Used on both sides: the `.astro` redirect and the
 * route's `beforeLoad`.
 */
export function safeRedirect(
  target: string | null | undefined,
  fallback = "/",
): string {
  if (!target || !target.startsWith("/")) return fallback;

  let url: URL;
  try {
    url = new URL(target, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE) return fallback;

  // Re-serialize from the parsed URL; never echo the raw input.
  return `${url.pathname}${url.search}${url.hash}`;
}
