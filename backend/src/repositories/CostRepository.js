const SELECT_COSTS = [
  "SELECT c.id, c.dry_dock_id AS dryDockId, c.work_order_id AS workOrderId, c.priority, c.status, c.budget, c.item_budget AS itemBudget,",
  "c.total_budget AS totalBudget, c.yard_estimate AS yardEstimate, c.owner_estimate AS ownerEstimate,",
  "c.total_estimates AS totalEstimates, c.actual_yard_cost AS actualYardCost,",
  "c.actual_owner_cost AS actualOwnerCost, c.total_costs AS totalCosts, c.variance,",
  "c.machinery_group AS machineryGroup, c.machinery, c.job_code AS jobCode, c.job_name AS jobName,",
  "c.job_category AS jobCategory, c.specification_group_id AS specificationGroupId,",
  "sg.name AS specificationGroupName, c.sort_order AS sortOrder, c.job_type AS jobType,",
  "c.critical_job AS criticalJob, c.internal_job AS internalJob, c.account_codes AS accountCodes,",
  "c.last_done_date AS lastDoneDate, c.last_done_value AS lastDoneValue,",
  "c.estimated_hours AS estimatedHours, c.job_description AS jobDescription,",
  "dd.currency, c.created_at AS createdAt, c.updated_at AS updatedAt",
  "FROM dry_dock_cost c JOIN dry_dock dd ON dd.id = c.dry_dock_id",
  "LEFT JOIN specification_group sg ON sg.id = c.specification_group_id"
].join(" ");

const COLUMNS = Object.freeze({
  priority: "priority", status: "status", budget: "budget", itemBudget: "item_budget",
  yardEstimate: "yard_estimate", ownerEstimate: "owner_estimate", actualYardCost: "actual_yard_cost",
  actualOwnerCost: "actual_owner_cost", machineryGroup: "machinery_group", machinery: "machinery",
  jobCode: "job_code", jobName: "job_name", jobCategory: "job_category",
  specificationGroupId: "specification_group_id", sortOrder: "sort_order", jobType: "job_type",
  criticalJob: "critical_job", internalJob: "internal_job", accountCodes: "account_codes",
  lastDoneDate: "last_done_date", lastDoneValue: "last_done_value", estimatedHours: "estimated_hours",
  jobDescription: "job_description"
});

export class CostRepository {
  constructor({ pool }) { this.pool = pool; }

  async dockExists(id) {
    const [rows] = await this.pool.execute("SELECT id FROM dry_dock WHERE id = ? LIMIT 1", [id]);
    return rows.length > 0;
  }

  async findDockReference(id) {
    const [rows] = await this.pool.execute("SELECT vessel_id AS vesselId FROM dry_dock WHERE id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
  }

  async findSpecificationGroupVesselId(id) {
    const [rows] = await this.pool.execute("SELECT vessel_id AS vesselId FROM specification_group WHERE id = ? LIMIT 1", [id]);
    return rows[0]?.vesselId ?? null;
  }

  async listForDock(dryDockId) {
    const [rows] = await this.pool.execute(SELECT_COSTS + " WHERE c.dry_dock_id = ? ORDER BY c.sort_order, c.id", [dryDockId]);
    return rows;
  }

  async createForDock(dryDockId, record) {
    const fields = Object.keys(COLUMNS);
    const [result] = await this.pool.execute(
      "INSERT INTO dry_dock_cost (dry_dock_id, " + fields.map((field) => COLUMNS[field]).join(", ") + ") VALUES (?, " + fields.map(() => "?").join(", ") + ")",
      [dryDockId, ...fields.map((field) => record[field] ?? null)]
    );
    return this.findById(result.insertId);
  }

  async findById(id) {
    const [rows] = await this.pool.execute(SELECT_COSTS + " WHERE c.id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
  }

  async update(id, changes) {
    const entries = Object.entries(changes).filter(([field]) => COLUMNS[field]);
    if (!entries.length) return this.findById(id);
    const assignments = entries.map(([field]) => COLUMNS[field] + " = ?").join(", ");
    const [result] = await this.pool.execute(
      "UPDATE dry_dock_cost SET " + assignments + " WHERE id = ?",
      [...entries.map(([, value]) => value), id]
    );
    return result.affectedRows ? this.findById(id) : null;
  }

  async delete(id) {
    const [result] = await this.pool.execute("DELETE FROM dry_dock_cost WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  async copyYardEstimatesToActual(dryDockId) {
    const [counts] = await this.pool.execute("SELECT COUNT(*) AS total FROM work_order WHERE dry_dock_id = ?", [dryDockId]);
    await this.pool.execute(
      "INSERT INTO dry_dock_cost (dry_dock_id, work_order_id, priority, status, budget, yard_estimate, owner_estimate, actual_yard_cost, actual_owner_cost, machinery_group, machinery, job_code, job_name, job_category, specification_group_id, sort_order, job_type, critical_job, internal_job, account_codes, last_done_date, last_done_value, estimated_hours, job_description) " +
      "SELECT wo.dry_dock_id, wo.id, wo.priority, wo.status, wo.total_budget, wo.yard_estimate, wo.owner_estimate, wo.yard_estimate, wo.actual_owner_cost, wo.machinery_group, wo.machinery, wo.job_code, wo.job_name, wo.job_category, wo.specification_group_id, wo.sort_order, wo.job_type, IF(wo.critical_job = 1, 'Yes', 'No'), IF(wo.internal_job = 1, 'Yes', 'No'), wo.account_codes, wo.last_done_date, wo.last_done_value, wo.estimated_hours, wo.description " +
      "FROM work_order wo WHERE wo.dry_dock_id = ? " +
      "ON DUPLICATE KEY UPDATE dry_dock_id = VALUES(dry_dock_id), priority = VALUES(priority), status = VALUES(status), budget = VALUES(budget), yard_estimate = VALUES(yard_estimate), owner_estimate = VALUES(owner_estimate), actual_yard_cost = COALESCE(dry_dock_cost.actual_yard_cost, VALUES(actual_yard_cost)), actual_owner_cost = COALESCE(dry_dock_cost.actual_owner_cost, VALUES(actual_owner_cost)), machinery_group = VALUES(machinery_group), machinery = VALUES(machinery), job_code = VALUES(job_code), job_name = VALUES(job_name), job_category = VALUES(job_category), specification_group_id = VALUES(specification_group_id), sort_order = VALUES(sort_order), job_type = VALUES(job_type), critical_job = VALUES(critical_job), internal_job = VALUES(internal_job), account_codes = VALUES(account_codes), last_done_date = VALUES(last_done_date), last_done_value = VALUES(last_done_value), estimated_hours = VALUES(estimated_hours), job_description = VALUES(job_description)",
      [dryDockId]
    );
    return Number(counts[0].total);
  }
}
