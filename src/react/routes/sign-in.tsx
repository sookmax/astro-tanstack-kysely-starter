import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-common";
import type { User } from "@/lib/schemas/user.schema";
import { SignInSearchParamsSchema } from "@/lib/schemas/signIn.schema";
import { safeRedirect } from "@/utils/safeRedirect";
import { PageLayout } from "../components/PageLayout";
import {
  SignInForm,
  type SignInMode,
  type SignInValues,
} from "../components/SignInForm";

export const Route = createFileRoute("/sign-in")({
  validateSearch: SignInSearchParamsSchema,
  beforeLoad: ({ context: { queryClient }, search }) => {
    // already signed in → straight on (sign-in.astro mirrors this)
    const user = queryClient.getQueryData<User | null>(queryKeys.user);
    if (user) {
      throw redirect({ href: safeRedirect(search.redirect) });
    }
  },
  component: SignIn,
});

function SignIn() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<SignInMode>("sign-in");

  const submit = useMutation({
    mutationFn: async ({ name, email, password }: SignInValues) => {
      const { error } =
        mode === "sign-up"
          ? await authClient.signUp.email({ name, email, password })
          : await authClient.signIn.email({ email, password });
      if (error) throw new Error(error.message ?? "Couldn't sign you in.");
    },
    onSuccess: () => {
      // A full page load, not a client navigation: every cached query was
      // fetched as a visitor, and the server re-renders the destination with
      // the new session (seeding `[user]` again).
      window.location.assign(safeRedirect(search.redirect));
    },
  });

  return (
    <PageLayout>
      <SignInForm
        mode={mode}
        onModeChange={(next) => {
          setMode(next);
          submit.reset();
        }}
        onSubmit={(values) => submit.mutate(values)}
        pending={submit.isPending}
        error={submit.error?.message ?? null}
      />
    </PageLayout>
  );
}
