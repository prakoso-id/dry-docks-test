import { z } from "zod";
import { optionalDate, optionalNonNegativeDecimal15_2 } from "./commonSchemas.js";
const text = (max = 5000) => z.string().trim().max(max).nullable().optional();
const optionalMoney = optionalNonNegativeDecimal15_2;
const purchaseOrderFields = {
  rfqId: z.number().int().positive().nullable().optional(),
  shipyardId: z.number().int().positive(),
  poNo: z.string().trim().min(1).max(100),
  poDate: optionalDate,
  currency: z.string().regex(/^[A-Z]{3}$/),
  totalCost: optionalMoney,
  totalCostUsd: optionalMoney,
  expenseCategory: text(100),
  accountCodeId: z.number().int().positive().nullable().optional(),
  supplyPort: text(200),
  deliveryDate: optionalDate,
  status: text(30),
  comments: text()
};

export const purchaseOrderCreateSchema = z.object(purchaseOrderFields).strict();
export const purchaseOrderUpdateSchema = z.object({
  ...purchaseOrderFields,
  shipyardId: purchaseOrderFields.shipyardId.optional(),
  poNo: purchaseOrderFields.poNo.optional(),
  currency: purchaseOrderFields.currency.optional()
}).strict().refine((value) => Object.keys(value).length > 0, { message: "At least one field must be provided" });
