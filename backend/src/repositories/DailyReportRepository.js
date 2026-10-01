const SELECT_REPORTS = "SELECT id, dry_dock_id AS dryDockId, title, report_type AS reportType, report_date AS reportDate, last_updated_by AS lastUpdatedBy, updated_text AS updatedText, extra_note AS extraNote, action, created_at AS createdAt, updated_at AS updatedAt FROM daily_report";
const UPDATE_COLUMNS = Object.freeze({
  title: "title", reportDate: "report_date", reportType: "report_type", lastUpdatedBy: "last_updated_by",
  updatedText: "updated_text", extraNote: "extra_note", action: "action"
});

export class DailyReportRepository {
  constructor({ pool }) { this.pool = pool; }

  async dockExists(dryDockId) {
    const [rows] = await this.pool.execute("SELECT id FROM dry_dock WHERE id = ? LIMIT 1", [dryDockId]);
    return rows.length > 0;
  }

  async listForDock(dryDockId) {
    const [rows] = await this.pool.execute(SELECT_REPORTS + " WHERE dry_dock_id = ? ORDER BY report_date DESC, id DESC", [dryDockId]);
    return rows;
  }

  async createForDock(dryDockId, report) {
    const [result] = await this.pool.execute(
      "INSERT INTO daily_report (dry_dock_id, title, report_type, report_date, last_updated_by, updated_text, extra_note, action) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [dryDockId, report.title, report.reportType, report.reportDate, report.lastUpdatedBy ?? null, report.updatedText ?? null, report.extraNote ?? null, report.action ?? null]
    );
    return this.findById(result.insertId);
  }

  async findById(id) {
    const [rows] = await this.pool.execute(SELECT_REPORTS + " WHERE id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
  }

  async update(id, changes) {
    const entries = Object.entries(changes).filter(([field]) => UPDATE_COLUMNS[field]);
    if (entries.length) {
      const assignments = entries.map(([field]) => UPDATE_COLUMNS[field] + " = ?").join(", ");
      await this.pool.execute("UPDATE daily_report SET " + assignments + " WHERE id = ?", [...entries.map(([, value]) => value), id]);
    }
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await this.pool.execute("DELETE FROM daily_report WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
}
