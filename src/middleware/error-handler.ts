import type { Context, Next } from "hono";

export interface AppError extends Error {
  status?: number;
  code?: string;
}

export class ValidationError extends Error {
  status = 400;
  code = "VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends Error {
  status = 429;
  code = "RATE_LIMIT_ERROR";

  constructor(message = "Too many requests") {
    super(message);
    this.name = "RateLimitError";
  }
}

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error("API Error:", error);

    if (error instanceof ValidationError || error instanceof RateLimitError) {
      return c.json({
        error: error.message,
        code: error.code
      }, error.status);
    }

    if (error instanceof Error && (error as AppError).status) {
      const appError = error as AppError;
      return c.json({
        error: appError.message,
        code: appError.code || "UNKNOWN_ERROR"
      }, appError.status);
    }

    // Default server error
    return c.json({
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    }, 500);
  }
}