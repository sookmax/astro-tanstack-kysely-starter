import fs from "node:fs";

// Server code reads config from process.env. Under `astro dev`, the better-auth
// CLI and the tsx migrate script, nothing loads .env into process.env for us,
// so do it here. In a container there's no .env file and the platform provides
// the variables, so this is a no-op. Scripts run from the repo root, hence the
// cwd-relative path.
export function loadEnv() {
  if (!process.env.DATABASE_URL && fs.existsSync(".env")) {
    process.loadEnvFile(".env");
  }
}
