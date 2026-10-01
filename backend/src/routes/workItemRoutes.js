import { Router } from "express";
import express from "express";
import {
  dryDockFactCreateSchema,
  taskCreateSchema,
  taskUpdateSchema,
  workOrderCreateSchema,
  workOrderExecutionUpdateSchema,
  workOrderUpdateSchema
} from "../validators/workItemSchemas.js";
import { validateBody } from "../validators/dryDockSchemas.js";
import { createShipyardSchema, createSpecificationGroupSchema, createVesselSchema } from "../validators/masterDataSchemas.js";

export function createWorkOrderCollectionRouter({ controller }) {
  const router = Router({ mergeParams: true });
  router.get("/", controller.listForDock);
  router.post("/", validateBody(workOrderCreateSchema), controller.createForDock);
  return router;
}

export function createWorkOrderRouter({ controller }) {
  const router = Router();
  router.patch("/:id", validateBody(workOrderUpdateSchema), controller.update);
  router.post("/:id/attachments", express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "5mb" }), controller.uploadImage);
  router.get("/:id/updates", controller.listUpdates);
  router.post("/:id/updates", validateBody(workOrderExecutionUpdateSchema), controller.addUpdate);
  return router;
}

export function createTaskCollectionRouter({ controller }) {
  const router = Router({ mergeParams: true });
  router.get("/", controller.listForDock);
  router.post("/", validateBody(taskCreateSchema), controller.createForDock);
  return router;
}

export function createTaskRouter({ controller }) {
  const router = Router();
  router.patch("/:id", validateBody(taskUpdateSchema), controller.update);
  return router;
}

export function createDryDockFactRouter({ controller }) {
  const router = Router({ mergeParams: true });
  router.get("/", controller.listForDock);
  router.post("/", validateBody(dryDockFactCreateSchema), controller.createForDock);
  return router;
}

export function createMasterDataRouter({ controller }) {
  const router = Router();
  router.post("/vessels", validateBody(createVesselSchema), controller.createVessel);
  router.get("/vessels", controller.listVessels);
  router.get("/shipyards", controller.listShipyards);
  router.post("/shipyards", validateBody(createShipyardSchema), controller.createShipyard);
  router.get("/account-codes", controller.listAccountCodes);
  router.get("/specification-groups", controller.listSpecificationGroups);
  router.post("/specification-groups", validateBody(createSpecificationGroupSchema), controller.createSpecificationGroup);
  return router;
}
