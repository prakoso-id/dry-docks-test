import { Router } from "express";
import { validateBody } from "../validators/dryDockSchemas.js";
import { reportCreateSchema, reportUpdateSchema } from "../validators/reportSchemas.js";

export function createDailyReportRouter({ controller }) {
  const router = Router();
  router.get("/dry-docks/:dryDockId/reports", controller.listForDock);
  router.post("/dry-docks/:dryDockId/reports", validateBody(reportCreateSchema), controller.createForDock);
  router.get("/reports/:id", controller.get);
  router.patch("/reports/:id", validateBody(reportUpdateSchema), controller.update);
  router.delete("/reports/:id", controller.delete);
  return router;
}
