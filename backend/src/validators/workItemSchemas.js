import { z } from "zod";
import { validationError } from "../errors/AppError.js";
import { decimal12_2, hasTwoDecimalPlacesOrLess, isoDate, optionalDate, optionalNonNegativeDecimal15_2, nonNegativeDecimal10_2 } from "./commonSchemas.js";

const optionalText = (max = 5000) => z.string().trim().max(max).nullable().optional();
const optionalMoney = optionalNonNegativeDecimal15_2;
const optionalId = z.number().int().positive().nullable().optional();

const workOrderFields = {
  specificationGroupId: z.number().int().positive(),
  machineryGroup: optionalText(200),
  machinery: optionalText(200),
  jobCode: optionalText(100),
  jobName: z.string().trim().min(1).max(255),
  title: optionalText(255),
  jobCategory: optionalText(100),
  jobType: optionalText(100),
  standardJob: z.boolean().optional(),
  criticalJob: z.boolean().optional(),
  internalJob: z.boolean().optional(),
  accountCodeId: optionalId,
  accountCodes: optionalText(255),
  lastDoneDate: optionalDate,
  lastDoneValue: decimal12_2.nullable().optional(),
  estimatedHours: nonNegativeDecimal10_2.nullable().optional(),
  description: z.string().trim().min(1).max(5000),
  responsibleRank: optionalText(100),
  priority: optionalText(30),
  status: optionalText(30),
  totalBudget: optionalMoney,
  internalEstimate: optionalMoney,
  yardEstimate: optionalMoney,
  ownerEstimate: optionalMoney,
  actualYardCost: optionalMoney,
  actualOwnerCost: optionalMoney,
  currency: z.string().regex(/^[A-Z]{3}$/),
  inspectionTypes: optionalText(5000),
  sortOrder: z.number().int().optional()
};

const costFields = {
  priority: optionalText(30),
  status: optionalText(30),
  budget: optionalMoney,
  itemBudget: optionalMoney,
  yardEstimate: optionalMoney,
  ownerEstimate: optionalMoney,
  actualYardCost: optionalMoney,
  actualOwnerCost: optionalMoney,
  machineryGroup: optionalText(200),
  machinery: optionalText(200),
  jobCode: optionalText(100),
  jobName: z.string().trim().min(1).max(255),
  jobCategory: optionalText(100),
  specificationGroupId: optionalId,
  sortOrder: z.number().int().optional(),
  jobType: optionalText(100),
  criticalJob: optionalText(30),
  internalJob: optionalText(30),
  accountCodes: optionalText(255),
  lastDoneDate: optionalDate,
  lastDoneValue: decimal12_2.nullable().optional(),
  estimatedHours: nonNegativeDecimal10_2.nullable().optional(),
  jobDescription: optionalText(5000)
};

export const costCreateSchema = z.object(costFields).strict();
export const costUpdateSchema = z.object({
  ...costFields,
  jobName: optionalText(255)
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided"
});

export const workOrderCreateSchema = z.object(workOrderFields).strict();
export const workOrderUpdateSchema = z.object({
  ...workOrderFields,
  specificationGroupId: z.number().int().positive().optional(),
  jobName: optionalText(255),
  description: optionalText(5000),
  currency: z.string().regex(/^[A-Z]{3}$/).optional()
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided"
});

export const workOrderExecutionUpdateSchema = z.object({
  progress: z.number().min(0).max(100).refine(hasTwoDecimalPlacesOrLess, "Must have at most two decimal places").nullable().optional(),
  actionType: optionalText(100),
  description: optionalText(5000),
  actualYardCost: optionalMoney,
  actualOwnerCost: optionalMoney
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided"
});

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: optionalText(),
  assignedUserId: optionalId,
  responsibleRank: optionalText(100),
  dueDate: isoDate,
  status: z.enum(["Open", "In Progress", "Closed"]).default("Open")
}).strict();

export const taskUpdateSchema = z.object({
  title: optionalText(255),
  description: optionalText(),
  assignedUserId: optionalId,
  responsibleRank: optionalText(100),
  dueDate: isoDate.optional(),
  status: z.enum(["Open", "In Progress", "Closed"]).optional()
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided"
});

export const dryDockFactCreateSchema = z.object({
  activity: z.string().trim().min(1).max(200),
  factDate: isoDate.nullable().optional(),
  factTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional()
}).strict();

export function assertValidInput(schema, input) {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  throw validationError(result.error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message
  })));
}
