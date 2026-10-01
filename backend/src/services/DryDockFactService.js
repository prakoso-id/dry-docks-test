import { AppError } from "../errors/AppError.js";

export class DryDockFactService {
  constructor({ repository }) {
    this.repository = repository;
  }

  async listForDock(dryDockId) {
    if (!(await this.repository.dockExists(dryDockId))) {
      throw new AppError(404, "NOT_FOUND", "Dry dock not found");
    }
    return this.repository.listForDock(dryDockId);
  }

  async createForDock(dryDockId, fact) {
    if (!(await this.repository.dockExists(dryDockId))) {
      throw new AppError(404, "NOT_FOUND", "Dry dock not found");
    }
    return this.repository.createForDock(dryDockId, fact);
  }
}
