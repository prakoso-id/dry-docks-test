const SELECT_WORK_ORDERS = [
  "SELECT wo.id, wo.dry_dock_id AS dryDockId, dd.vessel_id AS vesselId, v.name AS vesselName, wo.specification_group_id AS specificationGroupId,",
  "wo.machinery_group AS machineryGroup, wo.machinery, wo.job_code AS jobCode,",
  "wo.job_name AS jobName, wo.title, wo.job_category AS jobCategory, wo.job_type AS jobType,",
  "wo.standard_job AS standardJob, wo.critical_job AS criticalJob, wo.internal_job AS internalJob,",
  "wo.account_code_id AS accountCodeId, wo.account_codes AS accountCodes, wo.last_done_date AS lastDoneDate,",
  "wo.last_done_value AS lastDoneValue, wo.estimated_hours AS estimatedHours,",
  "wo.description, wo.responsible_rank AS responsibleRank, wo.priority, wo.status,",
  "wo.total_budget AS totalBudget, wo.internal_estimate AS internalEstimate, wo.yard_estimate AS yardEstimate, wo.owner_estimate AS ownerEstimate, wo.total_estimates AS totalEstimates,",
  "wo.actual_yard_cost AS actualYardCost, wo.actual_owner_cost AS actualOwnerCost,",
  "wo.currency, wo.inspection_types AS inspectionTypes, wo.sort_order AS sortOrder,",
  "sg.name AS specificationGroupName, wo.created_at AS createdAt, wo.updated_at AS updatedAt",
  "FROM work_order wo JOIN specification_group sg ON sg.id = wo.specification_group_id " +
  "JOIN dry_dock dd ON dd.id = wo.dry_dock_id JOIN vessel v ON v.id = dd.vessel_id"
].join(" ");

const UPDATE_COLUMNS = Object.freeze({
  specificationGroupId: "specification_group_id",
  machineryGroup: "machinery_group",
  machinery: "machinery",
  jobCode: "job_code",
  jobName: "job_name",
  title: "title",
  jobCategory: "job_category",
  jobType: "job_type",
  standardJob: "standard_job",
  criticalJob: "critical_job",
  internalJob: "internal_job",
  accountCodeId: "account_code_id",
  accountCodes: "account_codes",
  lastDoneDate: "last_done_date",
  lastDoneValue: "last_done_value",
  estimatedHours: "estimated_hours",
  description: "description",
  responsibleRank: "responsible_rank",
  priority: "priority",
  status: "status",
  totalBudget: "total_budget",
  internalEstimate: "internal_estimate",
  yardEstimate: "yard_estimate",
  ownerEstimate: "owner_estimate",
  actualYardCost: "actual_yard_cost",
  actualOwnerCost: "actual_owner_cost",
  currency: "currency",
  inspectionTypes: "inspection_types",
  sortOrder: "sort_order"
});

export class WorkOrderRepository {
  constructor({ pool }) {
    this.pool = pool;
  }

  async dockExists(dryDockId) {
    const [rows] = await this.pool.execute("SELECT id FROM dry_dock WHERE id = ? LIMIT 1", [dryDockId]);
    return rows.length > 0;
  }

  async findDockReference(dryDockId) {
    const [rows] = await this.pool.execute("SELECT vessel_id AS vesselId, currency FROM dry_dock WHERE id = ? LIMIT 1", [dryDockId]);
    return rows[0] ?? null;
  }

  async findSpecificationGroupVesselId(specificationGroupId) {
    const [rows] = await this.pool.execute("SELECT vessel_id AS vesselId FROM specification_group WHERE id = ? LIMIT 1", [specificationGroupId]);
    return rows[0]?.vesselId ?? null;
  }

  async listForDock(dryDockId) {
    const [rows] = await this.pool.execute(
      SELECT_WORK_ORDERS + " WHERE wo.dry_dock_id = ? ORDER BY wo.sort_order, wo.id",
      [dryDockId]
    );
    return this.withAttachments(rows);
  }

  async findById(id) {
    const [rows] = await this.pool.execute(SELECT_WORK_ORDERS + " WHERE wo.id = ? LIMIT 1", [id]);
    if (!rows[0]) return null;
    return (await this.withAttachments(rows))[0];
  }

  async withAttachments(workOrders) {
    if (!workOrders.length) return workOrders;
    const ids = workOrders.map(({ id }) => id);
    const [attachments] = await this.pool.execute(
      "SELECT id, work_order_id AS workOrderId, file_name AS fileName, mime_type AS mimeType, size_bytes AS sizeBytes, CONCAT('/uploads/', storage_key) AS url " +
        "FROM attachment WHERE work_order_id IN (" + ids.map(() => "?").join(", ") + ") ORDER BY id",
      ids
    );
    const byWorkOrder = new Map();
    for (const attachment of attachments) {
      const list = byWorkOrder.get(attachment.workOrderId) ?? [];
      list.push(attachment);
      byWorkOrder.set(attachment.workOrderId, list);
    }
    return workOrders.map((order) => ({ ...order, attachments: byWorkOrder.get(order.id) ?? [] }));
  }

  async addAttachment(workOrderId, attachment) {
    const [result] = await this.pool.execute(
      "INSERT INTO attachment (work_order_id, file_name, storage_key, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?)",
      [workOrderId, attachment.fileName, attachment.storageKey, attachment.mimeType, attachment.sizeBytes]
    );
    const [rows] = await this.pool.execute(
      "SELECT id, work_order_id AS workOrderId, file_name AS fileName, mime_type AS mimeType, size_bytes AS sizeBytes, CONCAT('/uploads/', storage_key) AS url FROM attachment WHERE id = ?",
      [result.insertId]
    );
    return rows[0];
  }

  async createForDock(dryDockId, record) {
    const columns = [
      "dry_dock_id", "specification_group_id", "machinery_group", "machinery",
      "job_code", "job_name", "title", "job_category", "job_type", "standard_job",
      "critical_job", "internal_job", "account_code_id", "account_codes", "last_done_date", "last_done_value",
      "estimated_hours", "description", "responsible_rank", "priority", "status",
      "total_budget", "internal_estimate", "yard_estimate", "owner_estimate", "actual_yard_cost",
      "actual_owner_cost", "currency", "inspection_types", "sort_order"
    ];
    const values = [
      dryDockId, record.specificationGroupId, record.machineryGroup ?? null, record.machinery ?? null,
      record.jobCode ?? null, record.jobName, record.title ?? null, record.jobCategory ?? null,
      record.jobType ?? null, record.standardJob ?? false, record.criticalJob ?? false,
      record.internalJob ?? false, record.accountCodeId ?? null, record.accountCodes ?? null, record.lastDoneDate ?? null,
      record.lastDoneValue ?? null, record.estimatedHours ?? null, record.description,
      record.responsibleRank ?? null, record.priority ?? null, record.status ?? null,
      record.totalBudget ?? null, record.internalEstimate ?? null, record.yardEstimate ?? null,
      record.ownerEstimate ?? null, record.actualYardCost ?? null, record.actualOwnerCost ?? null,
      record.currency, record.inspectionTypes ?? null, record.sortOrder ?? 0
    ];
    const [result] = await this.pool.execute(
      "INSERT INTO work_order (" + columns.join(", ") + ") VALUES (" + columns.map(() => "?").join(", ") + ")",
      values
    );
    return this.findById(result.insertId);
  }

  async update(id, changes) {
    const entries = Object.entries(changes).filter(([field]) => UPDATE_COLUMNS[field]);
    if (entries.length === 0) return this.findById(id);
    const assignments = entries.map(([field]) => UPDATE_COLUMNS[field] + " = ?").join(", ");
    const [result] = await this.pool.execute(
      "UPDATE work_order SET " + assignments + " WHERE id = ?",
      [...entries.map(([, value]) => value), id]
    );
    if (result.affectedRows === 0) return null;
    return this.findById(id);
  }

  async listUpdates(id) {
    const [rows] = await this.pool.execute(
      "SELECT id, work_order_id AS workOrderId, progress, action_type AS actionType, description, actual_yard_cost AS actualYardCost, actual_owner_cost AS actualOwnerCost, created_at AS createdAt FROM work_order_update WHERE work_order_id = ? ORDER BY created_at DESC, id DESC",
      [id]
    );
    return rows;
  }

  async addUpdate(id, update) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        "INSERT INTO work_order_update (work_order_id, progress, action_type, description, actual_yard_cost, actual_owner_cost) VALUES (?, ?, ?, ?, ?, ?)",
        [id, update.progress ?? null, update.actionType ?? null, update.description ?? null, update.actualYardCost ?? null, update.actualOwnerCost ?? null]
      );
      const actualCosts = ["actualYardCost", "actualOwnerCost"]
        .filter((field) => update[field] !== undefined && update[field] !== null);
      if (actualCosts.length) {
        const columns = { actualYardCost: "actual_yard_cost", actualOwnerCost: "actual_owner_cost" };
        await connection.execute(
          "UPDATE work_order SET " + actualCosts.map((field) => columns[field] + " = ?").join(", ") + " WHERE id = ?",
          [...actualCosts.map((field) => update[field]), id]
        );
      }
      const [rows] = await connection.execute(
        "SELECT id, work_order_id AS workOrderId, progress, action_type AS actionType, description, actual_yard_cost AS actualYardCost, actual_owner_cost AS actualOwnerCost, created_at AS createdAt FROM work_order_update WHERE id = ?",
        [result.insertId]
      );
      await connection.commit();
      return rows[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
