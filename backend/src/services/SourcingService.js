import { AppError } from "../errors/AppError.js";
import { RFQ } from "../models/RFQ.js";

const notFound = (name) => new AppError(404, "NOT_FOUND", `${name} not found`);
const conflict = (message) => new AppError(409, "CONFLICT", message);

function mapDuplicate(error) {
  if (error.code === "ER_DUP_ENTRY") throw conflict("An RFQ with this number already exists in the Dry Dock");
  throw error;
}

export class SourcingService {
  constructor({ repository }) { this.repository = repository; }

  async listRfqs(dryDockId) {
    if (!(await this.repository.dockExists(dryDockId))) throw notFound("Dry Dock");
    return this.repository.listRfqsForDock(dryDockId);
  }

  async createRfq(dryDockId, input) {
    if (!(await this.repository.dockExists(dryDockId))) throw notFound("Dry Dock");
    const rfq = new RFQ({ ...input, dryDockId }).assertValid().toRecord();
    try { return await this.repository.createRfq(dryDockId, rfq); }
    catch (error) { mapDuplicate(error); }
  }

  async updateRfq(id, changes) {
    const current = await this.repository.findRfqById(id);
    if (!current) throw notFound("RFQ");
    new RFQ({ ...current, ...changes }).assertValid();
    try { return await this.repository.updateRfq(id, changes); }
    catch (error) { mapDuplicate(error); }
  }

  async deleteRfq(id) {
    if (!(await this.repository.findRfqById(id))) throw notFound("RFQ");
    if (await this.repository.hasRfqDependents(id)) throw conflict("RFQ has invitations or Purchase Orders");
    if (!(await this.repository.deleteRfq(id))) throw notFound("RFQ");
  }

  async assertRfq(id) {
    const rfq = await this.repository.findRfqById(id);
    if (!rfq) throw notFound("RFQ");
    return rfq;
  }

  async listInvitations(rfqId) {
    await this.assertRfq(rfqId);
    return this.repository.listInvitations(rfqId);
  }

  async createInvitation(rfqId, input) {
    await this.assertRfq(rfqId);
    if (!(await this.repository.shipyardExists(input.shipyardId))) throw new AppError(422, "INVALID_REFERENCE", "Shipyard not found");
    return this.repository.createInvitation(rfqId, { ...input, status: input.status ?? "NOT SENT" });
  }

  async updateInvitation(id, changes) {
    if (!(await this.repository.findInvitationById(id))) throw notFound("Shipyard invitation");
    return this.repository.updateInvitation(id, changes);
  }

  async deleteInvitation(id) {
    if (!(await this.repository.findInvitationById(id))) throw notFound("Shipyard invitation");
    if (await this.repository.hasInvitationQuotations(id)) throw conflict("Invitation has quotations");
    if (!(await this.repository.deleteInvitation(id))) throw notFound("Shipyard invitation");
  }

  async listQuotations(invitationId) {
    if (!(await this.repository.findInvitationById(invitationId))) throw notFound("Shipyard invitation");
    return this.repository.listQuotations(invitationId);
  }

  async createQuotation(invitationId, input) {
    if (!(await this.repository.findInvitationById(invitationId))) throw notFound("Shipyard invitation");
    return this.repository.createQuotation(invitationId, input);
  }

  async updateQuotation(id, changes) {
    if (!(await this.repository.findQuotationById(id))) throw notFound("Quotation");
    return this.repository.updateQuotation(id, changes);
  }

  async deleteQuotation(id) {
    if (!(await this.repository.deleteQuotation(id))) throw notFound("Quotation");
  }

  async compareQuotes(dryDockId, rfqId) {
    const rfq = await this.assertRfq(rfqId);
    if (Number(rfq.dryDockId) !== Number(dryDockId)) throw notFound("RFQ");
    const currencies = new Map();
    for (const quote of await this.repository.listQuotesForRfq(dryDockId, rfqId)) {
      if (!currencies.has(quote.currency)) currencies.set(quote.currency, []);
      currencies.get(quote.currency).push(quote);
    }
    return { rfqId, currencies: [...currencies].map(([currency, quotes]) => ({ currency, quotes })) };
  }
}
