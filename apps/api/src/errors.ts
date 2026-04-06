/**
 * HTTP error class thrown by route handlers and middleware.
 * The central errorHandler in middleware/error-handler.ts catches these
 * and formats them into the ApiErrorEnvelope shape from @core/core.
 *
 * Separated from the error handler to avoid circular imports —
 * any file can throw HttpError without importing middleware.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}
