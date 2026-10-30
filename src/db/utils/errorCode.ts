// https://www.postgresql.org/docs/current/errcodes-appendix.html
// Match a DatabaseError on `code` + `constraint`, never on its message (which
// varies by Postgres version and locale).
export const errorCode = {
  foreign_key_violation: "23503",
  unique_violation: "23505",
  check_violation: "23514",
} as const;
