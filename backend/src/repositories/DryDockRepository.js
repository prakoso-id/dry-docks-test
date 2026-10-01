const SELECT_DOCKS = [
  "SELECT dd.id, dd.vessel_id AS vesselId, v.name AS vesselName,",
  "dd.dock_no AS dockNo, dd.description, dd.shipyard_id AS shipyardId,",
  "s.name AS shipyardName, dd.shipyard_details AS shipyardDetails,",
  "dd.planned_start AS plannedStart, dd.planned_end AS plannedEnd,",
  "dd.actual_start AS actualStart, dd.actual_end AS actualEnd,",
  "dd.completed_date AS completedDate, dd.account_code_id AS accountCodeId,",
  "dd.company, dd.budget, dd.currency, dd.manager_user_id AS managerUserId,",
  "u.full_name AS managerName, dd.responsible_rank AS responsibleRank,",
  "dd.status, dd.priority, dd.image_url AS imageUrl,",
  "dd.created_at AS createdAt, dd.updated_at AS updatedAt",
  "FROM dry_dock dd",
  "JOIN vessel v ON v.id = dd.vessel_id",
  "LEFT JOIN shipyard s ON s.id = dd.shipyard_id",
  "LEFT JOIN app_user u ON u.id = dd.manager_user_id"
].join(" ");

const UPDATE_COLUMNS = Object.freeze({
  vesselId: "vessel_id",
  dockNo: "dock_no",
  description: "description",
  shipyardId: "shipyard_id",
  shipyardDetails: "shipyard_details",
  plannedStart: "planned_start",
  plannedEnd: "planned_end",
  actualStart: "actual_start",
  actualEnd: "actual_end",
  completedDate: "completed_date",
  accountCodeId: "account_code_id",
  company: "company",
  budget: "budget",
  currency: "currency",
  managerUserId: "manager_user_id",
  responsibleRank: "responsible_rank",
  status: "status",
  priority: "priority",
  imageUrl: "image_url"
});

export class DryDockRepository {
  constructor({ pool }) {
    this.pool = pool;
  }

  async list(filters) {
    const conditions = [];
    const values = [];

    if (filters.search) {
      conditions.push("(dd.dock_no LIKE ? OR v.name LIKE ? OR dd.description LIKE ? OR s.name LIKE ?)");
      const pattern = "%" + filters.search + "%";
      values.push(pattern, pattern, pattern, pattern);
    }
    if (filters.status) {
      conditions.push("dd.status = ?");
      values.push(filters.status);
    }
    if (filters.vesselId) {
      conditions.push("dd.vessel_id = ?");
      values.push(filters.vesselId);
    }

    const where = conditions.length ? " WHERE " + conditions.join(" AND ") : "";
    const countSql = "SELECT COUNT(*) AS total FROM dry_dock dd JOIN vessel v ON v.id = dd.vessel_id LEFT JOIN shipyard s ON s.id = dd.shipyard_id" + where;
    const [countRows] = await this.pool.execute(countSql, values);
    const [items] = await this.pool.execute(
      SELECT_DOCKS + where + " ORDER BY dd.planned_start IS NULL, dd.planned_start DESC, dd.id DESC LIMIT ? OFFSET ?",
      [...values, filters.limit, filters.offset]
    );

    return { items, total: Number(countRows[0].total) };
  }

  async findById(id) {
    const [rows] = await this.pool.execute(SELECT_DOCKS + " WHERE dd.id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
  }

  async findCostSummaryInput(id) {
    const [docks] = await this.pool.execute(
      "SELECT budget, currency FROM dry_dock WHERE id = ? LIMIT 1",
      [id]
    );
    if (!docks.length) return null;
    const [costs] = await this.pool.execute(
      "SELECT total_budget AS totalBudget, yard_estimate AS yardEstimate, owner_estimate AS ownerEstimate, " +
        "actual_yard_cost AS actualYardCost, actual_owner_cost AS actualOwnerCost " +
        "FROM dry_dock_cost WHERE dry_dock_id = ? ORDER BY id",
      [id]
    );
    return {
      budget: docks[0].budget,
      currency: docks[0].currency,
      costs: costs.map((row) => ({
        currency: docks[0].currency,
        totalBudget: row.totalBudget,
        yardEstimate: row.yardEstimate,
        ownerEstimate: row.ownerEstimate,
        actualYardCost: row.actualYardCost,
        actualOwnerCost: row.actualOwnerCost
      }))
    };
  }

  async create(record) {
    const columns = [
      "vessel_id", "dock_no", "description", "shipyard_id", "shipyard_details",
      "planned_start", "planned_end", "actual_start", "actual_end", "completed_date",
      "account_code_id", "company", "budget", "currency", "manager_user_id",
      "responsible_rank", "status", "priority", "image_url"
    ];
    const values = [
      record.vesselId, record.dockNo, record.description, record.shipyardId ?? null,
      record.shipyardDetails ?? null, record.plannedStart ?? null, record.plannedEnd ?? null,
      record.actualStart ?? null, record.actualEnd ?? null, record.completedDate ?? null,
      record.accountCodeId ?? null, record.company ?? null, record.budget ?? null,
      record.currency, record.managerUserId ?? null, record.responsibleRank ?? null,
      record.status, record.priority, record.imageUrl ?? null
    ];
    const placeholders = columns.map(() => "?").join(", ");
    const [result] = await this.pool.execute(
      "INSERT INTO dry_dock (" + columns.join(", ") + ") VALUES (" + placeholders + ")",
      values
    );
    return this.findById(result.insertId);
  }

  async update(id, changes) {
    const entries = Object.entries(changes).filter(([field]) => UPDATE_COLUMNS[field]);
    if (entries.length === 0) return this.findById(id);
    const assignments = entries.map(([field]) => UPDATE_COLUMNS[field] + " = ?").join(", ");
    const values = entries.map(([, value]) => value);
    const [result] = await this.pool.execute(
      "UPDATE dry_dock SET " + assignments + " WHERE id = ?",
      [...values, id]
    );
    if (result.affectedRows === 0) return null;
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await this.pool.execute("DELETE FROM dry_dock WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
}
