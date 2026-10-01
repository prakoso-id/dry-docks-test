import { AppError } from "../errors/AppError.js";

export class TaskService {
  constructor({ repository }) {
    this.repository = repository;
  }

  async listForDock(dryDockId) {
    if (!(await this.repository.dockExists(dryDockId))) {
      throw new AppError(404, "NOT_FOUND", "Dry dock not found");
    }
    return this.repository.listForDock(dryDockId);
  }

  async createForDock(dryDockId, input) {
    if (!(await this.repository.dockExists(dryDockId))) {
      throw new AppError(404, "NOT_FOUND", "Dry dock not found");
    }
    return this.repository.createForDock(dryDockId, { ...input, status: input.status ?? "Open" });
  }

  async update(id, changes) {
    const current = await this.repository.findById(id);
    if (!current) throw new AppError(404, "NOT_FOUND", "Task not found");
    const updated = await this.repository.update(id, changes);
    if (!updated) throw new AppError(404, "NOT_FOUND", "Task not found");
    return updated;
  }
}
