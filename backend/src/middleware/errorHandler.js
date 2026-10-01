import { AppError } from "../errors/AppError.js";

export function notFoundHandler(_request, _response, next) {
  next(new AppError(404, "NOT_FOUND", "Route not found"));
}

export function errorHandler(error, _request, response, _next) {
  let appError = error;

  if (error?.type === "entity.too.large") {
    appError = new AppError(413, "PAYLOAD_TOO_LARGE", "The uploaded image exceeds the 5 MB limit");
  } else if (error?.code === "ER_DUP_ENTRY") {
    appError = new AppError(409, "CONFLICT", "A record with these values already exists");
  } else if (error?.code === "ER_ROW_IS_REFERENCED_2") {
    appError = new AppError(409, "CONFLICT", "This record is still used by related data");
  } else if (error?.code === "ER_NO_REFERENCED_ROW_2") {
    appError = new AppError(422, "INVALID_REFERENCE", "A referenced record does not exist");
  }

  if (!(appError instanceof AppError)) {
    console.error({
      event: "request_error",
      name: error?.name,
      code: error?.code
    });
    appError = new AppError(500, "INTERNAL_ERROR", "An internal error occurred");
  }

  response.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details ? { details: appError.details } : {})
    }
  });
}
