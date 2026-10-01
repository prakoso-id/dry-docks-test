import { validationError } from "../errors/AppError.js";

function validDate(value) {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export class DryDock {
  constructor(attributes) {
    this.attributes = { ...attributes };
  }

  assertValid() {
    const data = this.attributes;
    const dates = ["plannedStart", "plannedEnd", "actualStart", "actualEnd", "completedDate"];

    for (const field of dates) {
      if (!validDate(data[field])) {
        throw validationError([{ field, message: "Use a valid YYYY-MM-DD date" }]);
      }
    }

    if (data.plannedStart && data.plannedEnd && data.plannedEnd < data.plannedStart) {
      throw validationError([{ field: "plannedEnd", message: "Planned end must be on or after planned start" }]);
    }

    if (data.actualStart && data.actualEnd && data.actualEnd < data.actualStart) {
      throw validationError([{ field: "actualEnd", message: "Actual end must be on or after actual start" }]);
    }

    if (data.budget !== undefined && data.budget !== null && (!Number.isFinite(Number(data.budget)) || Number(data.budget) < 0)) {
      throw validationError([{ field: "budget", message: "Budget must be a non-negative number" }]);
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
