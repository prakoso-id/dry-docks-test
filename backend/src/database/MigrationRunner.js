export class MigrationRunner {
  constructor({ connection }) {
    this.connection = connection;
  }

  async migrate(migrations) {
    await this.connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migration (
        name VARCHAR(255) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    const [rows] = await this.connection.query("SELECT name FROM schema_migration");
    const applied = new Set(rows.map(({ name }) => name));
    const newlyApplied = [];

    for (const migration of migrations) {
      if (applied.has(migration.name)) continue;
      await this.connection.query(migration.sql);
      await this.connection.query("INSERT INTO schema_migration (name) VALUES (?)", [migration.name]);
      newlyApplied.push(migration.name);
    }

    return newlyApplied;
  }
}
