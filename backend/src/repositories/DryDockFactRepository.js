export class DryDockFactRepository {
  constructor({ pool }) {
    this.pool = pool;
  }

  async dockExists(dryDockId) {
    const [rows] = await this.pool.execute("SELECT id FROM dry_dock WHERE id = ? LIMIT 1", [dryDockId]);
    return rows.length > 0;
  }

  async listForDock(dryDockId) {
    const [rows] = await this.pool.execute(
      "SELECT id, dry_dock_id AS dryDockId, activity, fact_date AS factDate, fact_time AS factTime, created_at AS createdAt FROM dry_dock_fact WHERE dry_dock_id = ? ORDER BY fact_date, fact_time, id",
      [dryDockId]
    );
    return rows;
  }

  async createForDock(dryDockId, fact) {
    const [result] = await this.pool.execute(
      "INSERT INTO dry_dock_fact (dry_dock_id, activity, fact_date, fact_time) VALUES (?, ?, ?, ?)",
      [dryDockId, fact.activity, fact.factDate ?? null, fact.factTime ?? null]
    );
    const [rows] = await this.pool.execute(
      "SELECT id, dry_dock_id AS dryDockId, activity, fact_date AS factDate, fact_time AS factTime, created_at AS createdAt FROM dry_dock_fact WHERE id = ?",
      [result.insertId]
    );
    return rows[0];
  }
}
