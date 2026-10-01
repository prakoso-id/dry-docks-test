import dotenv from "dotenv";
import { resolve } from "node:path";
import { createApp } from "./app.js";
import { createDatabase } from "./config/database.js";
import { readConfig } from "./config/env.js";
import { DryDockFactRepository } from "./repositories/DryDockFactRepository.js";
import { DryDockRepository } from "./repositories/DryDockRepository.js";
import { DailyReportRepository } from "./repositories/DailyReportRepository.js";
import { SourcingRepository } from "./repositories/SourcingRepository.js";
import { PurchaseOrderRepository } from "./repositories/PurchaseOrderRepository.js";
import { MasterDataRepository } from "./repositories/MasterDataRepository.js";
import { TaskRepository } from "./repositories/TaskRepository.js";
import { WorkOrderRepository } from "./repositories/WorkOrderRepository.js";
import { CostRepository } from "./repositories/CostRepository.js";
import { LocalImageStorage } from "./services/LocalImageStorage.js";

dotenv.config({ path: resolve(process.cwd(), "../.env") });

const config = readConfig();
const database = createDatabase(config);
const dryDockRepository = new DryDockRepository({ pool: database.pool });
const workOrderRepository = new WorkOrderRepository({ pool: database.pool });
const costRepository = new CostRepository({ pool: database.pool });
const workOrderImageStorage = new LocalImageStorage({ directory: process.env.UPLOAD_DIR });
const taskRepository = new TaskRepository({ pool: database.pool });
const dryDockFactRepository = new DryDockFactRepository({ pool: database.pool });
const reportRepository = new DailyReportRepository({ pool: database.pool });
const sourcingRepository = new SourcingRepository({ pool: database.pool });
const purchaseOrderRepository = new PurchaseOrderRepository({ pool: database.pool });
const masterDataRepository = new MasterDataRepository({ pool: database.pool });
const app = createApp({
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
  corsOrigins: config.corsOrigins
});
const server = app.listen(config.PORT, () => {
  console.log("Dry Docks API listening on port " + config.PORT);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    server.close(() => {
      database.close().catch(() => process.exitCode = 1);
    });
  });
}
