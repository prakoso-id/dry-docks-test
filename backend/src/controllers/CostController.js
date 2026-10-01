import { parseId } from "../validators/parseId.js";

export class CostController {
  constructor({ service }) { this.service = service; }

  listForDock = async (request, response) => {
    response.json({ data: await this.service.listForDock(parseId(request.params.dryDockId)) });
  };

  createForDock = async (request, response) => {
    const data = await this.service.createForDock(parseId(request.params.dryDockId), request.validatedBody);
    response.status(201).json({ data });
  };

  update = async (request, response) => {
    response.json({ data: await this.service.update(parseId(request.params.id), request.validatedBody) });
  };

  delete = async (request, response) => {
    await this.service.delete(parseId(request.params.id));
    response.status(204).end();
  };

  copyYardEstimatesToActual = async (request, response) => {
    response.json({ data: await this.service.copyYardEstimatesToActual(parseId(request.params.dryDockId)) });
  };
}
