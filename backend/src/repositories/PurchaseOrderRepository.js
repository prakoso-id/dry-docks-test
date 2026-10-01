const SELECT_ORDERS = "SELECT po.id, po.dry_dock_id AS dryDockId, po.rfq_id AS rfqId, po.shipyard_id AS shipyardId, s.name AS shipyardName, po.po_no AS poNo, po.po_date AS poDate, po.expense_category AS expenseCategory, po.currency, po.total_cost AS totalCost, po.total_cost_usd AS totalCostUsd, po.account_code_id AS accountCodeId, po.supply_port AS supplyPort, po.delivery_date AS deliveryDate, po.status, po.comments, po.created_at AS createdAt, po.updated_at AS updatedAt FROM purchase_order po JOIN shipyard s ON s.id = po.shipyard_id";
const COLUMNS = Object.freeze({
  rfqId: "rfq_id", shipyardId: "shipyard_id", poNo: "po_no", poDate: "po_date",
  expenseCategory: "expense_category", currency: "currency", totalCost: "total_cost", totalCostUsd: "total_cost_usd",
  accountCodeId: "account_code_id", supplyPort: "supply_port", deliveryDate: "delivery_date", status: "status", comments: "comments"
});

export class PurchaseOrderRepository {
  constructor({ pool }) { this.pool = pool; }

  async dockExists(id) {
    const [rows] = await this.pool.execute("SELECT id FROM dry_dock WHERE id = ? LIMIT 1", [id]);
    return rows.length > 0;
  }

  async shipyardExists(id) {
    const [rows] = await this.pool.execute("SELECT id FROM shipyard WHERE id = ? LIMIT 1", [id]);
    return rows.length > 0;
  }

  async accountCodeExists(id) {
    const [rows] = await this.pool.execute("SELECT id FROM account_code WHERE id = ? LIMIT 1", [id]);
    return rows.length > 0;
  }

  async findRfqById(id) {
    const [rows] = await this.pool.execute("SELECT id, dry_dock_id AS dryDockId FROM rfq WHERE id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
  }

  async listForDock(dockId) {
    const [rows] = await this.pool.execute(SELECT_ORDERS + " WHERE po.dry_dock_id = ? ORDER BY po.expense_category, po.po_date DESC, po.id DESC", [dockId]);
    return rows;
  }

  async createForDock(dockId, order) {
    const fields = Object.keys(COLUMNS);
    const [result] = await this.pool.execute(
      "INSERT INTO purchase_order (dry_dock_id, " + fields.map((field) => COLUMNS[field]).join(", ") + ") VALUES (?, " + fields.map(() => "?").join(", ") + ")",
      [dockId, ...fields.map((field) => order[field] ?? null)]
    );
    return this.findById(result.insertId);
  }

  async findById(id) {
    const [rows] = await this.pool.execute(SELECT_ORDERS + " WHERE po.id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
  }

  async update(id, changes) {
    const entries = Object.entries(changes).filter(([field]) => COLUMNS[field]);
    if (entries.length) {
      const assignments = entries.map(([field]) => COLUMNS[field] + " = ?").join(", ");
      await this.pool.execute("UPDATE purchase_order SET " + assignments + " WHERE id = ?", [...entries.map(([, value]) => value), id]);
    }
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await this.pool.execute("DELETE FROM purchase_order WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
}
