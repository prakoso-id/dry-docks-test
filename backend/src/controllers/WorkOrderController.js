import { parseId } from "../validators/parseId.js";

export class WorkOrderController {
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

  listUpdates = async (request, response) => {
    const data = await this.service.listUpdates(parseId(request.params.id));
    response.json({ data });
  };

  addUpdate = async (request, response) => {
    const data = await this.service.addUpdate(parseId(request.params.id), request.validatedBody);
    response.status(201).json({ data });
  };

  uploadImage = async (request, response) => {
    const data = await this.service.addImage(parseId(request.params.id), {
      buffer: request.body,
      mimeType: request.get("content-type"),
      fileName: request.get("x-file-name")
    });
    response.status(201).json({ data });
  };
}
