export class AppError extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function validationError(details) {
  return new AppError(400, "VALIDATION_ERROR", "Request validation failed", details);
}
