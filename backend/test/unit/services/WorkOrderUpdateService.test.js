import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkOrderService } from '../../../src/services/WorkOrderService.js';

test('rejects changing a work order to a specification group from another vessel', async () => {
  let writes = 0;
  const repository = {
    findById: async () => ({ id: 4, dryDockId: 10, specificationGroupId: 5, jobName: 'Pump overhaul', description: 'Inspect pump', currency: 'USD' }),
    findDockReference: async () => ({ vesselId: 1, currency: 'USD' }),
    findSpecificationGroupVesselId: async () => 2,
    update: async () => { writes += 1; }
  };

  await assert.rejects(
    new WorkOrderService({ repository }).update(4, { specificationGroupId: 6 }),
    { statusCode: 422, code: 'INVALID_REFERENCE' }
  );
  assert.equal(writes, 0);
});

test('rejects updating a work order to a currency that differs from its dock', async () => {
  let writes = 0;
  const repository = {
    findById: async () => ({ id: 4, dryDockId: 10, specificationGroupId: 5, jobName: 'Pump overhaul', description: 'Inspect pump', currency: 'USD' }),
    findDockReference: async () => ({ vesselId: 1, currency: 'USD' }),
    update: async () => { writes += 1; }
  };

  await assert.rejects(
    new WorkOrderService({ repository }).update(4, { currency: 'EUR' }),
    { code: 'VALIDATION_ERROR' }
  );
  assert.equal(writes, 0);
});
