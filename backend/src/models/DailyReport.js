import { validationError } from "../errors/AppError.js";

export class DailyReport {
  constructor(attributes) {
    this.attributes = { ...attributes };
  }

  assertValid() {
    const { title, reportDate, reportType } = this.attributes;
    const issues = [];
    if (typeof title !== "string" || !title.trim() || title.length > 255) {
      issues.push({ field: "title", message: "Title is required and must be at most 255 characters" });
    }
    const date = typeof reportDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(reportDate)
      ? new Date(`${reportDate}T00:00:00.000Z`)
      : null;
    if (!date || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== reportDate) {
      issues.push({ field: "reportDate", message: "Report date must be a valid ISO calendar date" });
    }
    if (!["Daily", "Completion"].includes(reportType)) {
      issues.push({ field: "reportType", message: "Report type must be Daily or Completion" });
    }
    if (issues.length) throw validationError(issues);
    return this;
  }

  toRecord() {
    return { ...this.attributes, title: this.attributes.title.trim() };
  }
}
