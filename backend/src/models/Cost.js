import { validationError } from "../errors/AppError.js";

const amountFields = ["budget", "itemBudget", "yardEstimate", "ownerEstimate", "actualYardCost", "actualOwnerCost"];

export class Cost {
  constructor(attributes) {
    this.attributes = { ...attributes };
  }

  assertValid() {
    for (const field of amountFields) {
      const value = this.attributes[field];
      if (value !== undefined && value !== null && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        throw validationError([{ field, message: field + " must be a non-negative number" }]);
      }
    }
    return this;
  }

  toRecord() {
    return { ...this.attributes, sortOrder: this.attributes.sortOrder ?? 0 };
  }
}
