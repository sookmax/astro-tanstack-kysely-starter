import * as z from "zod";

export const SignInSearchParamsSchema = z.object({
  // where to go after signing in — always passed through safeRedirect
  redirect: z.string().optional(),
});
