import { createAuthClient } from "better-auth/react";

// Same-origin, so no baseURL: requests go to /api/auth/* on this host.
export const authClient = createAuthClient();
