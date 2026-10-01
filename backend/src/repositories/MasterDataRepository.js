export class MasterDataRepository {
  constructor({ pool }) {
    this.pool = pool;
  }

  async listVessels() {
    const [rows] = await this.pool.execute("SELECT id, name FROM vessel ORDER BY name");
    return rows;
  }

  async createVessel({ name }) {
    const [result] = await this.pool.execute("INSERT INTO vessel (name) VALUES (?)", [name]);
    const [rows] = await this.pool.execute("SELECT id, name FROM vessel WHERE id = ?", [result.insertId]);
    return rows[0];
  }

  async listShipyards() {
    const [rows] = await this.pool.execute("SELECT id, name, city, country FROM shipyard ORDER BY name");
    return rows;
  }

  async createShipyard(shipyard) {
    const [result] = await this.pool.execute(
      "INSERT INTO shipyard (name, address, contact_person, email, phone, city, country) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [shipyard.name, shipyard.address ?? null, shipyard.contactPerson ?? null, shipyard.email ?? null, shipyard.phone ?? null, shipyard.city ?? null, shipyard.country ?? null]
    );
    const [rows] = await this.pool.execute(
      "SELECT id, name, address, contact_person AS contactPerson, email, phone, city, country FROM shipyard WHERE id = ?",
      [result.insertId]
    );
    return rows[0];
  }

  async listAccountCodes() {
    const [rows] = await this.pool.execute("SELECT id, code, description FROM account_code ORDER BY code");
    return rows;
  }

  async listSpecificationGroups(vesselId) {
    const sql = "SELECT id, vessel_id AS vesselId, group_no AS groupNo, name, sort_order AS sortOrder, budget_code AS budgetCode FROM specification_group";
    const [rows] = vesselId
      ? await this.pool.execute(sql + " WHERE vessel_id = ? ORDER BY sort_order, name", [vesselId])
      : await this.pool.execute(sql + " ORDER BY vessel_id, sort_order, name");
    return rows;
  }

  async createSpecificationGroup({ vesselId, groupNo, name }) {
    const [result] = await this.pool.execute(
      "INSERT INTO specification_group (vessel_id, group_no, name) VALUES (?, ?, ?)",
      [vesselId, groupNo, name]
    );
    const [rows] = await this.pool.execute(
      "SELECT id, vessel_id AS vesselId, group_no AS groupNo, name, sort_order AS sortOrder, budget_code AS budgetCode FROM specification_group WHERE id = ?",
      [result.insertId]
    );
    return rows[0];
  }
}
