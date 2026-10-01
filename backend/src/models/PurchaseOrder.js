import { validationError } from "../errors/AppError.js";

export class PurchaseOrder {
  constructor(attributes) { this.attributes = { ...attributes }; }

  assertValid() {
    const data = this.attributes;
    const issues = [];
    for (const field of ["dryDockId", "shipyardId"]) {
      if (!Number.isInteger(Number(data[field])) || Number(data[field]) < 1) issues.push({ field, message: `${field} is required` });
    }
    if (typeof data.poNo !== "string" || !data.poNo.trim() || data.poNo.length > 100) issues.push({ field: "poNo", message: "Purchase Order number is required" });
    if (typeof data.currency !== "string" || !/^[A-Z]{3}$/.test(data.currency)) issues.push({ field: "currency", message: "Currency must be a three-letter uppercase code" });
    for (const field of ["totalCost", "totalCostUsd"]) {
      const amount = data[field];
      if (amount !== undefined && amount !== null && (!Number.isFinite(Number(amount)) || Number(amount) < 0)) {
        issues.push({ field, message: `${field} must be a non-negative amount` });
      }
    }
    if (issues.length) throw validationError(issues);
    return this;
  }

  toRecord() { return { ...this.attributes, poNo: this.attributes.poNo.trim() }; }
}
