import { Button } from "./Button";
import { Card } from "./Card";

export type SignInMode = "sign-in" | "sign-up";

export type SignInValues = {
  name: string;
  email: string;
  password: string;
};

type Props = {
  mode: SignInMode;
  onModeChange: (mode: SignInMode) => void;
  onSubmit: (values: SignInValues) => void;
  pending?: boolean;
  error?: string | null;
};

const input =
  "rounded-control border border-line bg-canvas px-3 py-2 outline-none focus:border-accent";

// Uncontrolled: no state, the values are read from the form on submit — so
// Enter in the last field submits what's actually typed, and password-manager
// autofill (which fires no React events in some browsers) is picked up too.
// The browser's own `required`/`type`/`minLength` checks run before onSubmit.
// Presentational; the route calls better-auth's client.
export function SignInForm({
  mode,
  onModeChange,
  onSubmit,
  pending = false,
  error,
}: Props) {
  const signUp = mode === "sign-up";

  return (
    <Card>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          // FormData values are string | File; these inputs only yield strings
          const field = (name: keyof SignInValues) => {
            const value = data.get(name);
            return typeof value === "string" ? value : "";
          };
          onSubmit({
            name: field("name"),
            email: field("email"),
            password: field("password"),
          });
        }}
      >
        <h1 className="text-xl font-bold">
          {signUp ? "Create an account" : "Sign in"}
        </h1>

        {signUp && (
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input
              className={input}
              name="name"
              autoComplete="name"
              required
            />
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            className={input}
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            className={input}
            name="password"
            type="password"
            autoComplete={signUp ? "new-password" : "current-password"}
            minLength={8}
            required
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={pending}>
          {signUp ? "Sign up" : "Sign in"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => onModeChange(signUp ? "sign-in" : "sign-up")}
        >
          {signUp ? "Have an account? Sign in" : "New here? Create an account"}
        </Button>
      </form>
    </Card>
  );
}
