import { AppError } from "../errors/AppError.js";
import { CostSummary } from "../models/CostSummary.js";
import { DryDock } from "../models/DryDock.js";
import { parseListQuery } from "../validators/dryDockSchemas.js";

function conflictFrom(error) {
  if (error.code === "ER_DUP_ENTRY") {
    return new AppError(409, "CONFLICT", "A dry dock with this vessel and dock number already exists");
  }
  return error;
}

export class DryDockService {
  constructor({ repository }) {
    this.repository = repository;
  }

  async list(query) {
    const filters = parseListQuery(query);
    const result = await this.repository.list(filters);
    return { ...result, page: filters.page, limit: filters.limit };
  }

  async getById(id) {
    const dryDock = await this.repository.findById(id);
    if (!dryDock) throw new AppError(404, "NOT_FOUND", "Dry dock not found");
    return dryDock;
  }

  async getCostSummary(id) {
    if (!(await this.repository.findById(id))) throw new AppError(404, "NOT_FOUND", "Dry dock not found");
    const input = await this.repository.findCostSummaryInput(id);
    if (!input) throw new AppError(404, "NOT_FOUND", "Dry dock not found");
    return CostSummary.from(input);
  }

  async create(input) {
    const dryDock = new DryDock({
      ...input,
      status: input.status ?? "Planning",
      priority: input.priority ?? "Medium"
    }).assertValid();

    try {
      return await this.repository.create(dryDock.toRecord());
    } catch (error) {
      throw conflictFrom(error);
    }
  }

  async update(id, changes) {
    if (Object.keys(changes).length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "At least one field must be provided");
    }
    const current = await this.repository.findById(id);
    if (!current) throw new AppError(404, "NOT_FOUND", "Dry dock not found");

    new DryDock({ ...current, ...changes }).assertValid();
    try {
      const updated = await this.repository.update(id, changes);
      if (!updated) throw new AppError(404, "NOT_FOUND", "Dry dock not found");
      return updated;
    } catch (error) {
      throw conflictFrom(error);
    }
  }

  async delete(id) {
    try {
      if (!(await this.repository.delete(id))) throw new AppError(404, "NOT_FOUND", "Dry dock not found");
    } catch (error) {
      if (["ER_ROW_IS_REFERENCED", "ER_ROW_IS_REFERENCED_2"].includes(error.code)) {
        throw new AppError(409, "CONFLICT", "Dry dock has related records; remove them before deleting it");
      }
      throw error;
    }
  }
}
