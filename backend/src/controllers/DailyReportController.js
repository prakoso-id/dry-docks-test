import { parseId } from "../validators/parseId.js";

export class DailyReportController {
  constructor({ service }) { this.service = service; }

  listForDock = async (request, response) => {
    response.json({ data: await this.service.listForDock(parseId(request.params.dryDockId)) });
  };

  createForDock = async (request, response) => {
    const data = await this.service.createForDock(parseId(request.params.dryDockId), request.validatedBody);
    response.status(201).json({ data });
  };

  get = async (request, response) => {
    response.json({ data: await this.service.getById(parseId(request.params.id)) });
  };

  update = async (request, response) => {
    response.json({ data: await this.service.update(parseId(request.params.id), request.validatedBody) });
  };

  delete = async (request, response) => {
    await this.service.delete(parseId(request.params.id));
    response.status(204).end();
  };
}
