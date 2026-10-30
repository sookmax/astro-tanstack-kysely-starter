import { Link } from "@tanstack/react-router";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/formatDate";
import type { Entry } from "@/lib/schemas/entry.schema";
import { Card } from "./Card";
import { Button } from "./Button";

type Props = {
  entry: Entry;
  onToggleLike: () => void;
  /** shown only on the author's own entry */
  onDelete?: () => void;
  deleting?: boolean;
  /** make the whole card open the entry's page (lists do; the detail page doesn't) */
  linkToEntry?: boolean;
};

// Presentational: data in, callbacks out — the containers (EntryItem) own the
// mutations. That keeps it renderable in Storybook with plain args.
//
// The whole card is clickable via a "stretched link": a real <Link> around the
// body text whose ::after covers the card. Keyboard focus, middle-click/new
// tab, prefetching and the accessible name (the body) all come from the link,
// and the buttons stay separate controls — they sit above the overlay
// (`relative z-10`) instead of being nested inside a clickable element.
export function EntryCard({
  entry,
  onToggleLike,
  onDelete,
  deleting = false,
  linkToEntry = true,
}: Props) {
  const date = formatDate(entry.created_at);

  return (
    <Card
      className={cn(
        "relative flex flex-col gap-3",
        // the link's focus ring, drawn on the whole card
        linkToEntry &&
          "transition-shadow hover:ring-1 hover:ring-line has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent",
      )}
      data-testid="entry"
    >
      <p className="whitespace-pre-wrap wrap-break-word text-ink">
        {linkToEntry ? (
          <Link
            to="/entries/$id"
            params={{ id: entry.id }}
            className="outline-none after:absolute after:inset-0 after:rounded-card"
          >
            {entry.body}
          </Link>
        ) : (
          entry.body
        )}
      </p>

      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <span className="font-medium text-ink">
          {entry.author?.name ?? "Guestbook"}
        </span>
        <span aria-hidden>·</span>
        <time dateTime={entry.created_at.toISOString()}>{date}</time>

        <div className="relative z-10 ml-auto flex items-center gap-1">
          {entry.is_author && onDelete && (
            <Button variant="ghost" onClick={onDelete} disabled={deleting}>
              Delete
            </Button>
          )}
          <LikeButton
            liked={entry.is_liked}
            count={entry.likes_count}
            onClick={onToggleLike}
          />
        </div>
      </div>
    </Card>
  );
}

export function LikeButton({
  liked,
  count,
  onClick,
}: {
  liked: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-control px-2.5 py-1.5 hover:bg-fill",
        liked ? "text-accent" : "text-ink-muted",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="size-4"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.2 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.8 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z" />
      </svg>
      <span data-testid="likes-count">{count}</span>
    </button>
  );
}
