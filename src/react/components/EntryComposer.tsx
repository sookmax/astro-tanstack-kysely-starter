import { useState } from "react";
import { ENTRY_BODY_MAX_LENGTH } from "@/constants";
import { InsertEntryBodySchema } from "@/lib/schemas/insertEntry.schema";
import { Button } from "./Button";
import { Card } from "./Card";

type Props = {
  onSubmit: (body: string) => void;
  pending?: boolean;
  /** a server error, shown inline */
  error?: string | null;
};

// An uncontrolled textarea: the submitted value is read from the form itself
// (FormData), so it can never be stale. `onChange` only feeds what has to be
// live while typing — the counter and the Post button — validated with the
// same Zod schema the API route uses. Presentational: the route owns the
// mutation.
export function EntryComposer({ onSubmit, pending = false, error }: Props) {
  const [draft, setDraft] = useState("");
  const valid = InsertEntryBodySchema.safeParse({ body: draft }).success;

  return (
    <Card>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = InsertEntryBodySchema.safeParse({
            body: new FormData(event.currentTarget).get("body"),
          });
          if (parsed.success) onSubmit(parsed.data.body);
        }}
      >
        <label htmlFor="entry-body" className="font-medium">
          Sign the guestbook
        </label>
        <textarea
          id="entry-body"
          name="body"
          onChange={(event) => setDraft(event.target.value)}
          maxLength={ENTRY_BODY_MAX_LENGTH}
          rows={4}
          placeholder="Say hello…"
          className="rounded-control border border-line bg-canvas p-3 outline-none focus:border-accent"
        />
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-faint">
            {draft.length}/{ENTRY_BODY_MAX_LENGTH}
          </span>
          {error && (
            <span role="alert" className="text-sm text-danger">
              {error}
            </span>
          )}
          <Button
            type="submit"
            variant="primary"
            className="ml-auto"
            disabled={!valid || pending}
          >
            {pending ? "Posting…" : "Post"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
