import { AppError, InternalServerError } from "./error";

// The catch-all at the end of an API route: our own AppErrors become their
// response, anything else is logged and becomes a generic 500.
export function handleApiError(error: unknown) {
  if (error instanceof AppError) return error.response();
  console.error(error);
  return InternalServerError.response();
}
