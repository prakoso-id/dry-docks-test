import { z } from "zod";

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Must be a valid calendar date");

export const optionalDate = isoDate.nullable().optional();
export const hasTwoDecimalPlacesOrLess = (value) => /^-?\d+(?:\.\d{1,2})?$/.test(String(value));
const decimal2 = (max) => z.number()
  .refine(hasTwoDecimalPlacesOrLess, "Must have at most two decimal places")
  .refine((value) => Math.abs(value) <= max, `Must not exceed ${max}`);

export const decimal15_2 = decimal2(9_999_999_999_999.99);
export const decimal12_2 = decimal2(9_999_999_999.99);
export const nonNegativeDecimal10_2 = decimal2(99_999_999.99).refine((value) => value >= 0, "Must be a non-negative amount");
export const optionalNonNegativeDecimal15_2 = decimal15_2.refine((value) => value >= 0, "Must be a non-negative amount").nullable().optional();
