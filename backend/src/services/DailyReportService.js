import { AppError } from "../errors/AppError.js";
import { DailyReport } from "../models/DailyReport.js";

export class DailyReportService {
  constructor({ repository }) { this.repository = repository; }

  async listForDock(dryDockId) {
    if (!(await this.repository.dockExists(dryDockId))) throw new AppError(404, "NOT_FOUND", "Dry dock not found");
    return this.repository.listForDock(dryDockId);
  }

  async createForDock(dryDockId, input) {
    if (!(await this.repository.dockExists(dryDockId))) throw new AppError(404, "NOT_FOUND", "Dry dock not found");
    return this.repository.createForDock(dryDockId, new DailyReport(input).assertValid().toRecord());
  }

  async getById(id) {
    const report = await this.repository.findById(id);
    if (!report) throw new AppError(404, "NOT_FOUND", "Report not found");
    return report;
  }

  async update(id, changes) {
    const current = await this.getById(id);
    new DailyReport({ ...current, ...changes }).assertValid();
    return this.repository.update(id, changes);
  }

  async delete(id) {
    if (!(await this.repository.delete(id))) throw new AppError(404, "NOT_FOUND", "Report not found");
  }
}
