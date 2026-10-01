import { validationError } from "../errors/AppError.js";

export class WorkOrder {
  constructor(attributes) {
    this.attributes = { ...attributes };
  }

  assertValid() {
    const data = this.attributes;
    for (const field of ["estimatedHours", "totalBudget", "internalEstimate", "yardEstimate", "ownerEstimate", "actualYardCost", "actualOwnerCost"]) {
      const value = data[field];
      if (value !== undefined && value !== null && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        throw validationError([{ field, message: field + " must be a non-negative number" }]);
      }
    }
    if (data.currency !== undefined && !/^[A-Z]{3}$/.test(data.currency)) {
      throw validationError([{ field: "currency", message: "Currency must be a three-letter uppercase code" }]);
    }
    return this;
  }

  toRecord() {
    return { ...this.attributes };
  }
}
