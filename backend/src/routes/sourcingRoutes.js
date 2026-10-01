import { Router } from "express";
import { validateBody } from "../validators/dryDockSchemas.js";
import {
  invitationCreateSchema, invitationUpdateSchema, quotationCreateSchema, quotationUpdateSchema,
  rfqCreateSchema, rfqUpdateSchema
} from "../validators/sourcingSchemas.js";

export function createSourcingRouter({ controller }) {
  const router = Router();
  router.get("/dry-docks/:dryDockId/rfqs", controller.listRfqs);
  router.post("/dry-docks/:dryDockId/rfqs", validateBody(rfqCreateSchema), controller.createRfq);
  router.get("/dry-docks/:dryDockId/quotation-comparison", controller.compareQuotes);
  router.patch("/rfqs/:id", validateBody(rfqUpdateSchema), controller.updateRfq);
  router.delete("/rfqs/:id", controller.deleteRfq);
  router.get("/rfqs/:rfqId/invitations", controller.listInvitations);
  router.post("/rfqs/:rfqId/invitations", validateBody(invitationCreateSchema), controller.createInvitation);
  router.patch("/rfq-invitations/:id", validateBody(invitationUpdateSchema), controller.updateInvitation);
  router.delete("/rfq-invitations/:id", controller.deleteInvitation);
  router.get("/rfq-invitations/:invitationId/quotations", controller.listQuotations);
  router.post("/rfq-invitations/:invitationId/quotations", validateBody(quotationCreateSchema), controller.createQuotation);
  router.patch("/quotations/:id", validateBody(quotationUpdateSchema), controller.updateQuotation);
  router.delete("/quotations/:id", controller.deleteQuotation);
  return router;
}
