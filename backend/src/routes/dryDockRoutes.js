import { Router } from "express";
import { createDryDockSchema, updateDryDockSchema, validateBody } from "../validators/dryDockSchemas.js";

export function createDryDockRouter({ controller }) {
  const router = Router();
  router.get("/", controller.list);
  router.post("/", validateBody(createDryDockSchema), controller.create);
  router.get("/:id/cost-summary", controller.getCostSummary);
  router.get("/:id", controller.get);
  router.patch("/:id", validateBody(updateDryDockSchema), controller.update);
  router.delete("/:id", controller.delete);
  return router;
}
