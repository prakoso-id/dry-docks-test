const SELECT_TASKS = "SELECT id, dry_dock_id AS dryDockId, title, description, assigned_user_id AS assignedUserId, responsible_rank AS responsibleRank, due_date AS dueDate, status, created_at AS createdAt, updated_at AS updatedAt FROM task";

const UPDATE_COLUMNS = Object.freeze({
  title: "title",
  description: "description",
  assignedUserId: "assigned_user_id",
  responsibleRank: "responsible_rank",
  dueDate: "due_date",
  status: "status"
});

export class TaskRepository {
  constructor({ pool }) {
    this.pool = pool;
  }

  async dockExists(dryDockId) {
    const [rows] = await this.pool.execute("SELECT id FROM dry_dock WHERE id = ? LIMIT 1", [dryDockId]);
    return rows.length > 0;
  }

  async listForDock(dryDockId) {
    const [rows] = await this.pool.execute(SELECT_TASKS + " WHERE dry_dock_id = ? ORDER BY due_date, id", [dryDockId]);
    return rows;
  }

  async findById(id) {
    const [rows] = await this.pool.execute(SELECT_TASKS + " WHERE id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
  }

  async createForDock(dryDockId, task) {
    const [result] = await this.pool.execute(
      "INSERT INTO task (dry_dock_id, title, description, assigned_user_id, responsible_rank, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [dryDockId, task.title, task.description ?? null, task.assignedUserId ?? null, task.responsibleRank ?? null, task.dueDate, task.status]
    );
    return this.findById(result.insertId);
  }

  async update(id, changes) {
    const entries = Object.entries(changes).filter(([field]) => UPDATE_COLUMNS[field]);
    if (entries.length === 0) return this.findById(id);
    const assignments = entries.map(([field]) => UPDATE_COLUMNS[field] + " = ?").join(", ");
    const [result] = await this.pool.execute(
      "UPDATE task SET " + assignments + " WHERE id = ?",
      [...entries.map(([, value]) => value), id]
    );
    if (result.affectedRows === 0) return null;
    return this.findById(id);
  }
}
