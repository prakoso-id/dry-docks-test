import cors from "cors";
import express from "express";
import helmet from "helmet";
import { resolve } from "node:path";
import { DryDockController } from "./controllers/DryDockController.js";
import { DailyReportController } from "./controllers/DailyReportController.js";
import { SourcingController } from "./controllers/SourcingController.js";
import { PurchaseOrderController } from "./controllers/PurchaseOrderController.js";
import { DryDockFactController } from "./controllers/DryDockFactController.js";
import { MasterDataController } from "./controllers/MasterDataController.js";
import { TaskController } from "./controllers/TaskController.js";
import { WorkOrderController } from "./controllers/WorkOrderController.js";
import { CostController } from "./controllers/CostController.js";
import { AppError } from "./errors/AppError.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import {
  createDryDockFactRouter,
  createMasterDataRouter,
  createTaskCollectionRouter,
  createTaskRouter,
  createWorkOrderCollectionRouter,
  createWorkOrderRouter
} from "./routes/workItemRoutes.js";
import { DryDockService } from "./services/DryDockService.js";
import { DailyReportService } from "./services/DailyReportService.js";
import { SourcingService } from "./services/SourcingService.js";
import { PurchaseOrderService } from "./services/PurchaseOrderService.js";
import { DryDockFactService } from "./services/DryDockFactService.js";
import { TaskService } from "./services/TaskService.js";
import { WorkOrderService } from "./services/WorkOrderService.js";
import { CostService } from "./services/CostService.js";
import { createDryDockRouter } from "./routes/dryDockRoutes.js";
import { createDailyReportRouter } from "./routes/dailyReportRoutes.js";
import { createSourcingRouter } from "./routes/sourcingRoutes.js";
import { createPurchaseOrderRouter } from "./routes/purchaseOrderRoutes.js";
import { createCostCollectionRouter, createCostRouter } from "./routes/costRoutes.js";

export function createApp({
  dryDockRepository,
  workOrderRepository,
  costRepository,
  workOrderImageStorage,
  taskRepository,
  dryDockFactRepository,
  reportRepository,
  sourcingRepository,
  purchaseOrderRepository,
  masterDataRepository,
  database,
  corsOrigins = []
}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: corsOrigins.length ? corsOrigins : false }));
  app.use(express.json({ limit: "1mb" }));
  const uploadDirectory = process.env.UPLOAD_DIR || resolve(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadDirectory, { dotfiles: "deny", index: false, maxAge: "1h" }));

  app.get("/api/v1/health/live", (_request, response) => {
    response.json({ status: "ok" });
  });
  app.get("/api/v1/health/ready", async (_request, response, next) => {
    try {
      await database.ping();
      response.json({ status: "ready" });
    } catch (error) {
      next(new AppError(503, "DATABASE_UNAVAILABLE", "Database is not ready"));
    }
  });

  const service = new DryDockService({ repository: dryDockRepository });
  const controller = new DryDockController({ service });
  app.use("/api/v1/dry-docks", createDryDockRouter({ controller }));
  app.use("/api/v1", createDailyReportRouter({ controller: new DailyReportController({ service: new DailyReportService({ repository: reportRepository }) }) }));
  app.use("/api/v1", createSourcingRouter({ controller: new SourcingController({ service: new SourcingService({ repository: sourcingRepository }) }) }));
  app.use("/api/v1", createPurchaseOrderRouter({ controller: new PurchaseOrderController({ service: new PurchaseOrderService({ repository: purchaseOrderRepository }) }) }));

  const costController = new CostController({ service: new CostService({ repository: costRepository }) });
  app.use("/api/v1/dry-docks/:dryDockId/costs", createCostCollectionRouter({ controller: costController }));
  app.use("/api/v1/costs", createCostRouter({ controller: costController }));

  const workOrderController = new WorkOrderController({
    service: new WorkOrderService({ repository: workOrderRepository, imageStorage: workOrderImageStorage })
  });
  app.use(
    "/api/v1/dry-docks/:dryDockId/work-orders",
    createWorkOrderCollectionRouter({ controller: workOrderController })
  );
  app.use("/api/v1/work-orders", createWorkOrderRouter({ controller: workOrderController }));

  const taskController = new TaskController({
    service: new TaskService({ repository: taskRepository })
  });
  app.use("/api/v1/dry-docks/:dryDockId/tasks", createTaskCollectionRouter({ controller: taskController }));
  app.use("/api/v1/tasks", createTaskRouter({ controller: taskController }));

  const factController = new DryDockFactController({
    service: new DryDockFactService({ repository: dryDockFactRepository })
  });
  app.use("/api/v1/dry-docks/:dryDockId/facts", createDryDockFactRouter({ controller: factController }));

  app.use("/api/v1", createMasterDataRouter({
    controller: new MasterDataController({ repository: masterDataRepository })
  }));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
