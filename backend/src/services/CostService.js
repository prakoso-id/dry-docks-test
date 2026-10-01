import { AppError } from "../errors/AppError.js";
import { Cost } from "../models/Cost.js";

const notFound = (name) => new AppError(404, "NOT_FOUND", `${name} not found`);

export class CostService {
  constructor({ repository }) { this.repository = repository; }

  async listForDock(dryDockId) {
    if (!(await this.repository.dockExists(dryDockId))) throw notFound("Dry Dock");
    return this.repository.listForDock(dryDockId);
  }

  async validateSpecificationGroup(dryDockId, specificationGroupId) {
    if (specificationGroupId == null) return;
    const [dock, vesselId] = await Promise.all([
      this.repository.findDockReference(dryDockId),
      this.repository.findSpecificationGroupVesselId(specificationGroupId)
    ]);
    if (!dock || !vesselId || Number(vesselId) !== Number(dock.vesselId)) {
      throw new AppError(422, "INVALID_REFERENCE", "Specification group must belong to the dry dock vessel");
    }
  }

  async createForDock(dryDockId, input) {
    if (!(await this.repository.dockExists(dryDockId))) throw notFound("Dry Dock");
    const cost = new Cost(input).assertValid().toRecord();
    await this.validateSpecificationGroup(dryDockId, cost.specificationGroupId);
    return this.repository.createForDock(dryDockId, cost);
  }

  async update(id, changes) {
    const current = await this.repository.findById(id);
    if (!current) throw notFound("Cost");
    const cost = new Cost({ ...current, ...changes }).assertValid().toRecord();
    await this.validateSpecificationGroup(current.dryDockId, cost.specificationGroupId);
    return this.repository.update(id, changes);
  }

  async delete(id) {
    if (!(await this.repository.delete(id))) throw notFound("Cost");
  }

  async copyYardEstimatesToActual(dryDockId) {
    if (!(await this.repository.dockExists(dryDockId))) throw notFound("Dry Dock");
    return { updatedCount: await this.repository.copyYardEstimatesToActual(dryDockId) };
  }
}
