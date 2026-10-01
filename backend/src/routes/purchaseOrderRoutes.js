import { Router } from "express";
import { validateBody } from "../validators/dryDockSchemas.js";
import { purchaseOrderCreateSchema, purchaseOrderUpdateSchema } from "../validators/purchaseOrderSchemas.js";

export function createPurchaseOrderRouter({ controller }) {
  const router = Router();
  router.get("/dry-docks/:dryDockId/purchase-orders", controller.listForDock);
  router.post("/dry-docks/:dryDockId/purchase-orders", validateBody(purchaseOrderCreateSchema), controller.createForDock);
  router.get("/purchase-orders/:id", controller.get);
  router.patch("/purchase-orders/:id", validateBody(purchaseOrderUpdateSchema), controller.update);
  router.delete("/purchase-orders/:id", controller.delete);
  return router;
}
