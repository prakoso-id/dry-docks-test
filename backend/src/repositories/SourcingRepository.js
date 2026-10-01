const SELECT_RFQS = "SELECT id, dry_dock_id AS dryDockId, rfq_no AS rfqNo, request_date AS requestDate, expiry_date AS expiryDate, status, subject, comments, requisition_type AS requisitionType, requisition_date AS requisitionDate, requisition_nature AS requisitionNature, voyage_number AS voyageNumber, account_code_id AS accountCodeId, supply_port AS supplyPort, supply_date AS supplyDate, created_at AS createdAt, updated_at AS updatedAt FROM rfq";
const RFQ_COLUMNS = Object.freeze({
  rfqNo: "rfq_no", requestDate: "request_date", expiryDate: "expiry_date", status: "status", subject: "subject",
  comments: "comments", requisitionType: "requisition_type", requisitionDate: "requisition_date",
  requisitionNature: "requisition_nature", voyageNumber: "voyage_number", accountCodeId: "account_code_id",
  supplyPort: "supply_port", supplyDate: "supply_date"
});
const SELECT_INVITATIONS = "SELECT i.id, i.rfq_id AS rfqId, i.shipyard_id AS shipyardId, s.name AS shipyardName, i.status, i.sent_at AS sentAt, i.created_at AS createdAt FROM rfq_invitation i JOIN shipyard s ON s.id = i.shipyard_id";
const SELECT_QUOTATIONS = "SELECT id, rfq_invitation_id AS rfqInvitationId, quote_no AS quoteNo, quote_date AS quoteDate, currency, total_cost AS totalCost, tax, terms, comments, created_at AS createdAt, updated_at AS updatedAt FROM quotation";
const QUOTATION_COLUMNS = Object.freeze({
  quoteNo: "quote_no", quoteDate: "quote_date", currency: "currency", totalCost: "total_cost",
  tax: "tax", terms: "terms", comments: "comments"
});

async function updateById(pool, table, columns, id, changes) {
  const entries = Object.entries(changes).filter(([field]) => columns[field]);
  if (entries.length) {
    const assignments = entries.map(([field]) => columns[field] + " = ?").join(", ");
    await pool.execute(`UPDATE ${table} SET ${assignments} WHERE id = ?`, [...entries.map(([, value]) => value), id]);
  }
}

export class SourcingRepository {
  constructor({ pool }) { this.pool = pool; }

  async dockExists(id) {
    const [rows] = await this.pool.execute("SELECT id FROM dry_dock WHERE id = ? LIMIT 1", [id]);
    return rows.length > 0;
  }

  async listRfqsForDock(dockId) {
    const [rows] = await this.pool.execute(SELECT_RFQS + " WHERE dry_dock_id = ? ORDER BY request_date DESC, id DESC", [dockId]);
    return rows;
  }

  async createRfq(dockId, rfq) {
    const fields = Object.keys(RFQ_COLUMNS);
    const [result] = await this.pool.execute(
      "INSERT INTO rfq (dry_dock_id, " + fields.map((field) => RFQ_COLUMNS[field]).join(", ") + ") VALUES (?, " + fields.map(() => "?").join(", ") + ")",
      [dockId, ...fields.map((field) => rfq[field] ?? null)]
    );
    return this.findRfqById(result.insertId);
  }

  async findRfqById(id) {
    const [rows] = await this.pool.execute(SELECT_RFQS + " WHERE id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
  }

  async updateRfq(id, changes) {
    await updateById(this.pool, "rfq", RFQ_COLUMNS, id, changes);
    return this.findRfqById(id);
  }

  async hasRfqDependents(id) {
    const [rows] = await this.pool.execute(
      "SELECT EXISTS(SELECT 1 FROM rfq_invitation WHERE rfq_id = ?) OR EXISTS(SELECT 1 FROM purchase_order WHERE rfq_id = ?) AS found",
      [id, id]
    );
    return Boolean(rows[0].found);
  }

  async deleteRfq(id) {
    const [result] = await this.pool.execute("DELETE FROM rfq WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  async shipyardExists(id) {
    const [rows] = await this.pool.execute("SELECT id FROM shipyard WHERE id = ? LIMIT 1", [id]);
    return rows.length > 0;
  }

  async listInvitations(rfqId) {
    const [rows] = await this.pool.execute(SELECT_INVITATIONS + " WHERE i.rfq_id = ? ORDER BY s.name, i.id", [rfqId]);
    return rows;
  }

  async createInvitation(rfqId, invitation) {
    const [result] = await this.pool.execute(
      "INSERT INTO rfq_invitation (rfq_id, shipyard_id, status) VALUES (?, ?, ?)",
      [rfqId, invitation.shipyardId, invitation.status]
    );
    return this.findInvitationById(result.insertId);
  }

  async findInvitationById(id) {
    const [rows] = await this.pool.execute(SELECT_INVITATIONS + " WHERE i.id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
  }

  async updateInvitation(id, changes) {
    await updateById(this.pool, "rfq_invitation", { status: "status" }, id, changes);
    return this.findInvitationById(id);
  }

  async hasInvitationQuotations(id) {
    const [rows] = await this.pool.execute("SELECT 1 FROM quotation WHERE rfq_invitation_id = ? LIMIT 1", [id]);
    return rows.length > 0;
  }

  async deleteInvitation(id) {
    const [result] = await this.pool.execute("DELETE FROM rfq_invitation WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  async listQuotations(invitationId) {
    const [rows] = await this.pool.execute(SELECT_QUOTATIONS + " WHERE rfq_invitation_id = ? ORDER BY quote_date DESC, id DESC", [invitationId]);
    return rows;
  }

  async createQuotation(invitationId, quote) {
    const fields = Object.keys(QUOTATION_COLUMNS);
    const [result] = await this.pool.execute(
      "INSERT INTO quotation (rfq_invitation_id, " + fields.map((field) => QUOTATION_COLUMNS[field]).join(", ") + ") VALUES (?, " + fields.map(() => "?").join(", ") + ")",
      [invitationId, ...fields.map((field) => quote[field] ?? null)]
    );
    return this.findQuotationById(result.insertId);
  }

  async findQuotationById(id) {
    const [rows] = await this.pool.execute(SELECT_QUOTATIONS + " WHERE id = ? LIMIT 1", [id]);
    return rows[0] ?? null;
  }

  async updateQuotation(id, changes) {
    await updateById(this.pool, "quotation", QUOTATION_COLUMNS, id, changes);
    return this.findQuotationById(id);
  }

  async deleteQuotation(id) {
    const [result] = await this.pool.execute("DELETE FROM quotation WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  async listQuotesForRfq(dockId, rfqId) {
    const [rows] = await this.pool.execute(
      "SELECT q.id, q.rfq_invitation_id AS rfqInvitationId, q.quote_no AS quoteNo, q.quote_date AS quoteDate, q.currency, q.total_cost AS totalCost, s.name AS shipyardName " +
        "FROM rfq r JOIN rfq_invitation i ON i.rfq_id = r.id JOIN quotation q ON q.rfq_invitation_id = i.id " +
        "JOIN shipyard s ON s.id = i.shipyard_id WHERE r.dry_dock_id = ? AND r.id = ? ORDER BY q.currency, q.total_cost, s.name",
      [dockId, rfqId]
    );
    return rows;
  }
}
