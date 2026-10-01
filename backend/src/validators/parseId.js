import { AppError } from "../errors/AppError.js";

export function parseId(value) {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new AppError(400, "VALIDATION_ERROR", "Id must be a positive integer");
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id)) {
    throw new AppError(400, "VALIDATION_ERROR", "Id is outside the supported range");
  }
  return id;
}
