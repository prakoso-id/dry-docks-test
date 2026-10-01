import { parseId } from "../validators/parseId.js";

export class MasterDataController {
  constructor({ repository }) {
    this.repository = repository;
  }

  listVessels = async (_request, response) => {
    response.json({ data: await this.repository.listVessels() });
  };

  createVessel = async (request, response) => {
    response.status(201).json({ data: await this.repository.createVessel(request.validatedBody) });
  };

  listShipyards = async (_request, response) => {
    response.json({ data: await this.repository.listShipyards() });
  };

  createShipyard = async (request, response) => {
    response.status(201).json({ data: await this.repository.createShipyard(request.validatedBody) });
  };

  listAccountCodes = async (_request, response) => {
    response.json({ data: await this.repository.listAccountCodes() });
  };

  listSpecificationGroups = async (request, response) => {
    let vesselId;
    if (request.query.vesselId !== undefined) {
      vesselId = parseId(request.query.vesselId);
    }
    response.json({ data: await this.repository.listSpecificationGroups(vesselId) });
  };

  createSpecificationGroup = async (request, response) => {
    response.status(201).json({ data: await this.repository.createSpecificationGroup(request.validatedBody) });
  };
}
