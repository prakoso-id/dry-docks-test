import { z } from "zod";
import { optionalDate, optionalNonNegativeDecimal15_2 } from "./commonSchemas.js";
const text = (max = 5000) => z.string().trim().max(max).nullable().optional();
const id = z.number().int().positive();
const optionalMoney = optionalNonNegativeDecimal15_2;

const rfqFields = {
  rfqNo: z.string().trim().min(1).max(100),
  requestDate: optionalDate,
  expiryDate: optionalDate,
  status: text(30),
  subject: text(255),
  comments: text(),
  requisitionType: text(100),
  requisitionDate: optionalDate,
  requisitionNature: text(100),
  voyageNumber: text(100),
  accountCodeId: id.nullable().optional(),
  supplyPort: text(200),
  supplyDate: optionalDate
};

function validateDateOrder(data) {
  return !data.requestDate || !data.expiryDate || data.expiryDate >= data.requestDate;
}

export const rfqCreateSchema = z.object(rfqFields).strict().refine(validateDateOrder, {
  path: ["expiryDate"], message: "Expiry date must not be before RFQ date"
});
export const rfqUpdateSchema = z.object({ ...rfqFields, rfqNo: rfqFields.rfqNo.optional() }).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided"
}).refine(validateDateOrder, { path: ["expiryDate"], message: "Expiry date must not be before RFQ date" });

export const invitationCreateSchema = z.object({ shipyardId: id, status: text(30) }).strict();
export const invitationUpdateSchema = z.object({ status: z.string().trim().min(1).max(30) }).strict();
export const quotationCreateSchema = z.object({
  quoteNo: text(100), quoteDate: optionalDate, currency: z.string().regex(/^[A-Z]{3}$/),
  totalCost: optionalMoney, tax: optionalMoney, terms: text(), comments: text()
}).strict();
export const quotationUpdateSchema = z.object({
  quoteNo: text(100), quoteDate: optionalDate, currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  totalCost: optionalMoney, tax: optionalMoney, terms: text(), comments: text()
}).strict().refine((value) => Object.keys(value).length > 0, { message: "At least one field must be provided" });
