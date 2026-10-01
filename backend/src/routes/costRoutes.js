import { Router } from "express";
import { validateBody } from "../validators/dryDockSchemas.js";
import { costCreateSchema, costUpdateSchema } from "../validators/workItemSchemas.js";

export function createCostCollectionRouter({ controller }) {
  const router = Router({ mergeParams: true });
  router.get("/", controller.listForDock);
  router.post("/", validateBody(costCreateSchema), controller.createForDock);
  router.post("/copy-yard-estimates-to-actual", controller.copyYardEstimatesToActual);
  return router;
}

export function createCostRouter({ controller }) {
  const router = Router();
  router.patch("/:id", validateBody(costUpdateSchema), controller.update);
  router.delete("/:id", controller.delete);
  return router;
}
