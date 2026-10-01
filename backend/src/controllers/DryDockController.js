import { parseId } from "../validators/parseId.js";

export class DryDockController {
  constructor({ service }) {
    this.service = service;
  }

  list = async (request, response) => {
    const result = await this.service.list(request.query);
    response.json({
      data: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total }
    });
  };

  get = async (request, response) => {
    response.json({ data: await this.service.getById(parseId(request.params.id)) });
  };

  getCostSummary = async (request, response) => {
    response.json({ data: await this.service.getCostSummary(parseId(request.params.id)) });
  };

  create = async (request, response) => {
    const data = await this.service.create(request.validatedBody);
    response.status(201).json({ data });
  };

  update = async (request, response) => {
    const data = await this.service.update(parseId(request.params.id), request.validatedBody);
    response.json({ data });
  };

  delete = async (request, response) => {
    await this.service.delete(parseId(request.params.id));
    response.status(204).end();
  };
}
