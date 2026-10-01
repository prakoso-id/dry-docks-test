import { z } from "zod";

export const createVesselSchema = z.object({
  name: z.string().trim().min(1).max(200)
}).strict();

const optionalText = (max) => z.string().trim().max(max).nullable().optional();
export const createShipyardSchema = z.object({
  name: z.string().trim().min(1).max(200),
  address: optionalText(500),
  contactPerson: optionalText(200),
  email: z.string().trim().email().max(254).nullable().optional(),
  phone: optionalText(50),
  city: optionalText(100),
  country: optionalText(100)
}).strict();

export const createSpecificationGroupSchema = z.object({
  vesselId: z.number().int().positive(),
  groupNo: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255)
}).strict();
