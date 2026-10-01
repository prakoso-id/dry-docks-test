import { parseId } from "../validators/parseId.js";

export class TaskController {
  constructor({ service }) {
    this.service = service;
  }

  listForDock = async (request, response) => {
    const data = await this.service.listForDock(parseId(request.params.dryDockId));
    response.json({ data });
  };

  createForDock = async (request, response) => {
    const data = await this.service.createForDock(
      parseId(request.params.dryDockId),
      request.validatedBody
    );
    response.status(201).json({ data });
  };

  update = async (request, response) => {
    const data = await this.service.update(parseId(request.params.id), request.validatedBody);
    response.json({ data });
  };
}
