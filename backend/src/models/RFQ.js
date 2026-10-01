import { validationError } from "../errors/AppError.js";

const validDate = (value) => {
  if (value == null || value === "") return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};

export class RFQ {
  constructor(attributes) { this.attributes = { ...attributes }; }

  assertValid() {
    const data = this.attributes;
    const issues = [];
    if (!Number.isInteger(Number(data.dryDockId)) || Number(data.dryDockId) < 1) issues.push({ field: "dryDockId", message: "Dry Dock is required" });
    if (typeof data.rfqNo !== "string" || !data.rfqNo.trim() || data.rfqNo.length > 100) issues.push({ field: "rfqNo", message: "RFQ number is required" });
    for (const field of ["requestDate", "expiryDate", "requisitionDate", "supplyDate"]) {
      if (!validDate(data[field])) issues.push({ field, message: "Must be a valid ISO calendar date" });
    }
    if (data.requestDate && data.expiryDate && data.expiryDate < data.requestDate) {
      issues.push({ field: "expiryDate", message: "Expiry date must not be before RFQ date" });
    }
    if (issues.length) throw validationError(issues);
    return this;
  }

  toRecord() { return { ...this.attributes, rfqNo: this.attributes.rfqNo.trim() }; }
}
