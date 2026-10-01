import { z } from "zod";
import { isoDate } from "./commonSchemas.js";
const reportType = z.enum(["Daily", "Completion"]);
const optionalText = (max) => z.string().trim().max(max).nullable().optional();

export const reportCreateSchema = z.object({
  title: z.string().trim().min(1).max(255),
  reportDate: isoDate,
  reportType,
  lastUpdatedBy: optionalText(200),
  updatedText: optionalText(5000),
  extraNote: optionalText(5000),
  action: optionalText(255)
}).strict();

export const reportUpdateSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  reportDate: isoDate.optional(),
  reportType: reportType.optional(),
  lastUpdatedBy: optionalText(200),
  updatedText: optionalText(5000),
  extraNote: optionalText(5000),
  action: optionalText(255)
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided"
});
