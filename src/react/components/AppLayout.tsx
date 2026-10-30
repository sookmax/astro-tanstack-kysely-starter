import { Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { fetchUserOptions } from "@/lib/query-client";
import { authClient } from "@/lib/auth-client";
import { Button } from "./Button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <Nav />
      {children}
    </div>
  );
}

const navLink =
  "rounded-control px-2.5 py-1.5 text-sm text-ink-muted hover:bg-fill hover:text-ink data-[status=active]:text-ink data-[status=active]:font-medium";

function Nav() {
  // This subscription is also what keeps the `[user]` cache alive for the
  // routes' auth gates (see __root.tsx).
  const { data: user } = useSuspenseQuery(fetchUserOptions);
  const queryClient = useQueryClient();

  const signOut = async () => {
    await authClient.signOut();
    // Every cached query is per-viewer (is_liked, is_author, "mine"): drop
    // them all and reload, so the server renders the page as a visitor.
    queryClient.clear();
    window.location.assign("/");
  };

  return (
    <header className="border-b border-line bg-card">
      <nav className="mx-auto max-w-xl px-4 h-14 flex items-center gap-1">
        <Link to="/" className="mr-auto font-bold text-ink">
          Guestbook
        </Link>
        {user ? (
          <>
            <Link to="/new" className={navLink}>
              New entry
            </Link>
            <Link to="/me" className={navLink}>
              My entries
            </Link>
            <Button variant="ghost" onClick={() => void signOut()}>
              Sign out
            </Button>
          </>
        ) : (
          <Link to="/sign-in" className={navLink}>
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
