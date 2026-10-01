import { parseId } from "../validators/parseId.js";

export class SourcingController {
  constructor({ service }) { this.service = service; }

  listRfqs = async (request, response) => response.json({ data: await this.service.listRfqs(parseId(request.params.dryDockId)) });
  createRfq = async (request, response) => response.status(201).json({ data: await this.service.createRfq(parseId(request.params.dryDockId), request.validatedBody) });
  updateRfq = async (request, response) => response.json({ data: await this.service.updateRfq(parseId(request.params.id), request.validatedBody) });
  deleteRfq = async (request, response) => { await this.service.deleteRfq(parseId(request.params.id)); response.status(204).end(); };

  listInvitations = async (request, response) => response.json({ data: await this.service.listInvitations(parseId(request.params.rfqId)) });
  createInvitation = async (request, response) => response.status(201).json({ data: await this.service.createInvitation(parseId(request.params.rfqId), request.validatedBody) });
  updateInvitation = async (request, response) => response.json({ data: await this.service.updateInvitation(parseId(request.params.id), request.validatedBody) });
  deleteInvitation = async (request, response) => { await this.service.deleteInvitation(parseId(request.params.id)); response.status(204).end(); };

  listQuotations = async (request, response) => response.json({ data: await this.service.listQuotations(parseId(request.params.invitationId)) });
  createQuotation = async (request, response) => response.status(201).json({ data: await this.service.createQuotation(parseId(request.params.invitationId), request.validatedBody) });
  updateQuotation = async (request, response) => response.json({ data: await this.service.updateQuotation(parseId(request.params.id), request.validatedBody) });
  deleteQuotation = async (request, response) => { await this.service.deleteQuotation(parseId(request.params.id)); response.status(204).end(); };

  compareQuotes = async (request, response) => response.json({
    data: await this.service.compareQuotes(parseId(request.params.dryDockId), parseId(request.query.rfqId))
  });
}
