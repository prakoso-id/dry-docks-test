import { AppError, validationError } from "../errors/AppError.js";
import { WorkOrder } from "../models/WorkOrder.js";

export class WorkOrderService {
  constructor({ repository, imageStorage }) {
    this.repository = repository;
    this.imageStorage = imageStorage;
  }

  async listForDock(dryDockId) {
    if (!(await this.repository.dockExists(dryDockId))) {
      throw new AppError(404, "NOT_FOUND", "Dry dock not found");
    }
    return this.repository.listForDock(dryDockId);
  }

  async createForDock(dryDockId, input) {
    const dock = await this.repository.findDockReference(dryDockId);
    if (!dock) throw new AppError(404, "NOT_FOUND", "Dry dock not found");
    if (input.currency !== dock.currency) throw validationError([{ field: "currency", message: "Currency must match the dry dock currency" }]);
    const groupVesselId = await this.repository.findSpecificationGroupVesselId(input.specificationGroupId);
    if (!groupVesselId || Number(groupVesselId) !== Number(dock.vesselId)) {
      throw new AppError(422, "INVALID_REFERENCE", "Specification group must belong to the dry dock vessel");
    }
    const workOrder = new WorkOrder(input).assertValid();
    return this.repository.createForDock(dryDockId, workOrder.toRecord());
  }

  async update(id, changes) {
    const current = await this.repository.findById(id);
    if (!current) throw new AppError(404, "NOT_FOUND", "Work order not found");
    const dock = await this.repository.findDockReference(current.dryDockId);
    if (!dock) throw new AppError(404, "NOT_FOUND", "Dry dock not found");
    if ((changes.currency ?? current.currency) !== dock.currency) {
      throw validationError([{ field: "currency", message: "Currency must match the dry dock currency" }]);
    }
    if (changes.specificationGroupId !== undefined) {
      const groupVesselId = changes.specificationGroupId === null
        ? null
        : await this.repository.findSpecificationGroupVesselId(changes.specificationGroupId);
      if (!groupVesselId || Number(groupVesselId) !== Number(dock.vesselId)) {
        throw new AppError(422, "INVALID_REFERENCE", "Specification group must belong to the dry dock vessel");
      }
    }
    new WorkOrder({ ...current, ...changes }).assertValid();
    return this.repository.update(id, changes);
  }

  async listUpdates(id) {
    if (!(await this.repository.findById(id))) throw new AppError(404, "NOT_FOUND", "Work order not found");
    return this.repository.listUpdates(id);
  }

  async addUpdate(id, input) {
    if (!(await this.repository.findById(id))) throw new AppError(404, "NOT_FOUND", "Work order not found");
    if (input.progress !== undefined && input.progress !== null && (input.progress < 0 || input.progress > 100)) {
      throw validationError([{ field: "progress", message: "Progress must be between 0 and 100" }]);
    }
    for (const field of ["actualYardCost", "actualOwnerCost"]) {
      if (input[field] !== undefined && input[field] !== null && input[field] < 0) {
        throw validationError([{ field, message: field + " must be non-negative" }]);
      }
    }
    return this.repository.addUpdate(id, input);
  }

  async addImage(id, input) {
    if (!(await this.repository.findById(id))) throw new AppError(404, "NOT_FOUND", "Work order not found");
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(input.mimeType) || !Buffer.isBuffer(input.buffer) || input.buffer.length === 0) {
      throw validationError([{ field: "attachment", message: "Choose a JPEG, PNG, or WebP image" }]);
    }
    if (input.buffer.length > 5 * 1024 * 1024) {
      throw validationError([{ field: "attachment", message: "Image must be 5 MB or smaller" }]);
    }
    const stored = await this.imageStorage.save(input);
    try {
      return await this.repository.addAttachment(id, { ...stored, mimeType: input.mimeType, sizeBytes: input.buffer.length });
    } catch (error) {
      await this.imageStorage.remove(stored.storageKey);
      throw error;
    }
  }
}
