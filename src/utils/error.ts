// One error type for every boundary. API routes `return SomeError.response()`;
// client fetch wrappers `throw await AppError.fromResponse(res)`; the router's
// ErrorFallback and the Astro 404/500 pages render it through ErrorView.
export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }

  response() {
    return new Response(this.message, { status: this.statusCode });
  }

  static async fromResponse(response: Response) {
    const message = (await response.text()) || response.statusText;
    return new AppError(message, response.status);
  }
}

// Only our own AppError strings are safe to show; anything else is generic.
export function getErrorMessage(error: unknown) {
  if (!error) return null;
  return error instanceof AppError ? error.message : "Something went wrong.";
}

export const InvalidRequestBodyError = new AppError("Invalid request body", 400);
export const InvalidSearchParamsError = new AppError(
  "Invalid search parameters",
  400,
);
export const AuthRequiredError = new AppError("Sign in required", 401);
export const NotFoundError = new AppError("Not found", 404);
export const EntryNotFoundError = new AppError("Entry not found", 404);
export const InternalServerError = new AppError(
  "An unexpected error occurred",
  500,
);
