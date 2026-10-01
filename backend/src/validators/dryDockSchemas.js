import { z } from "zod";
import { validationError } from "../errors/AppError.js";
import { optionalDate, optionalNonNegativeDecimal15_2 } from "./commonSchemas.js";

const optionalText = (max) => z.string().trim().max(max).nullable().optional();
const optionalId = z.number().int().positive().nullable().optional();

const dryDockFields = {
  vesselId: optionalId,
  dockNo: optionalText(100),
  description: optionalText(5000),
  shipyardId: optionalId,
  shipyardDetails: optionalText(5000),
  plannedStart: optionalDate,
  plannedEnd: optionalDate,
  actualStart: optionalDate,
  actualEnd: optionalDate,
  completedDate: optionalDate,
  accountCodeId: optionalId,
  company: optionalText(200),
  budget: optionalNonNegativeDecimal15_2,
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  managerUserId: optionalId,
  responsibleRank: optionalText(100),
  status: z.enum(["Planning", "Execution", "Completed"]).optional(),
  priority: z.enum(["Medium", "Low"]).optional(),
  imageUrl: optionalText(1000)
};

export const createDryDockSchema = z.object({
  ...dryDockFields,
  vesselId: z.number().int().positive(),
  dockNo: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(5000),
  currency: z.string().regex(/^[A-Z]{3}$/)
}).strict();

export const updateDryDockSchema = z.object(dryDockFields)
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided"
  });

const boundedInteger = (fallback, max) => z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) && number > max ? max : number;
}, z.number().int().min(1).max(max));

const listQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(["Planning", "Execution", "Completed"]).optional(),
  vesselId: z.coerce.number().int().positive().optional(),
  page: boundedInteger(1, 1000000),
  limit: boundedInteger(20, 100)
});

function detailsFromZod(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message
  }));
}

export function parseListQuery(input) {
  const result = listQuerySchema.safeParse(input);
  if (!result.success) throw validationError(detailsFromZod(result.error));
  const { page, limit, ...filters } = result.data;
  return { ...filters, page, limit, offset: (page - 1) * limit };
}

export function validateBody(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);
    if (!result.success) return next(validationError(detailsFromZod(result.error)));
    request.validatedBody = result.data;
    return next();
  };
}
