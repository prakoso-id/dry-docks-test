import { AppError } from "../errors/AppError.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";

const notFound = (name) => new AppError(404, "NOT_FOUND", `${name} not found`);

export class PurchaseOrderService {
  constructor({ repository }) { this.repository = repository; }

  async listForDock(dryDockId) {
    if (!(await this.repository.dockExists(dryDockId))) throw notFound("Dry Dock");
    return this.repository.listForDock(dryDockId);
  }

  async validateReferences(dryDockId, values) {
    if (!(await this.repository.shipyardExists(values.shipyardId))) throw new AppError(422, "INVALID_REFERENCE", "Shipyard not found");
    if (values.rfqId != null) {
      const rfq = await this.repository.findRfqById(values.rfqId);
      if (!rfq || Number(rfq.dryDockId) !== Number(dryDockId)) throw new AppError(422, "INVALID_REFERENCE", "RFQ must belong to the same Dry Dock");
    }
    if (values.accountCodeId != null && !(await this.repository.accountCodeExists(values.accountCodeId))) {
      throw new AppError(422, "INVALID_REFERENCE", "Account Code not found");
    }
  }

  async createForDock(dryDockId, input) {
    if (!(await this.repository.dockExists(dryDockId))) throw notFound("Dry Dock");
    const order = new PurchaseOrder({ ...input, dryDockId }).assertValid().toRecord();
    await this.validateReferences(dryDockId, order);
    try { return await this.repository.createForDock(dryDockId, order); }
    catch (error) {
      if (error.code === "ER_DUP_ENTRY") throw new AppError(409, "CONFLICT", "Purchase Order number already exists in this Dry Dock");
      throw error;
    }
  }

  async update(id, changes) {
    const current = await this.repository.findById(id);
    if (!current) throw notFound("Purchase Order");
    const order = new PurchaseOrder({ ...current, ...changes }).assertValid().toRecord();
    await this.validateReferences(current.dryDockId, order);
    try { return await this.repository.update(id, changes); }
    catch (error) {
      if (error.code === "ER_DUP_ENTRY") throw new AppError(409, "CONFLICT", "Purchase Order number already exists in this Dry Dock");
      throw error;
    }
  }

  async getById(id) {
    const order = await this.repository.findById(id);
    if (!order) throw notFound("Purchase Order");
    return order;
  }

  async delete(id) {
    if (!(await this.repository.delete(id))) throw notFound("Purchase Order");
  }
}
