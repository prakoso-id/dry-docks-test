import test from "node:test";
import assert from "node:assert/strict";
import { SourcingRepository } from "../../../src/repositories/SourcingRepository.js";
import { PurchaseOrderRepository } from "../../../src/repositories/PurchaseOrderRepository.js";

test("sourcing and purchase inserts bind every column", async () => {
  let inserts = 0;
  const pool = {
    async execute(sql, values) {
      if (sql.startsWith("INSERT")) {
        assert.equal((sql.match(/\?/g) ?? []).length, values.length);
        inserts += 1;
        return [{ insertId: 7 }];
      }
      return [[{ id: 7 }]];
    }
  };

  const sourcing = new SourcingRepository({ pool });
  await sourcing.createRfq(1, { rfqNo: "QA-RFQ" });
  await sourcing.createQuotation(2, { quoteNo: "QA-QUOTE" });
  await new PurchaseOrderRepository({ pool }).createForDock(3, { shipyardId: 4, currency: "USD" });
  assert.equal(inserts, 3);
});
