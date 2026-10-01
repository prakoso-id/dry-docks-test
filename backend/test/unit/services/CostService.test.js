import test from 'node:test';
import assert from 'node:assert/strict';
import { CostService } from '../../../src/services/CostService.js';

function createService(overrides = {}) {
  const calls = {};
  const repository = {
    dockExists: async () => true,
    findDockReference: async () => ({ vesselId: 8 }),
    findSpecificationGroupVesselId: async () => 8,
    createForDock: async (id, values) => { calls.created = { id, ...values }; return calls.created; },
    findById: async () => ({ id: 2, dryDockId: 10, jobName: 'Pump' }),
    update: async (id, changes) => ({ id, ...changes }),
    delete: async () => true,
    copyYardEstimatesToActual: async (id) => { calls.copiedId = id; return 4; },
    listForDock: async () => [],
    ...overrides
  };
  return { service: new CostService({ repository }), calls };
}

test('creates a Cost after verifying its Specification Group belongs to the vessel', async () => {
  const { service, calls } = createService();
  const record = await service.createForDock(10, { jobName: 'Pump', specificationGroupId: 3, yardEstimate: 20 });
  assert.equal(record.id, 10);
  assert.equal(calls.created.yardEstimate, 20);
  assert.equal(calls.created.sortOrder, 0);
});

test('rejects a Specification Group from another vessel before saving a Cost', async () => {
  let writes = 0;
  const { service } = createService({ findSpecificationGroupVesselId: async () => 99, createForDock: async () => { writes++; } });
  await assert.rejects(service.createForDock(10, { jobName: 'Pump', specificationGroupId: 3 }), { code: 'INVALID_REFERENCE' });
  assert.equal(writes, 0);
});

test('returns the number of Cost rows affected by the copy action', async () => {
  const { service, calls } = createService();
  assert.deepEqual(await service.copyYardEstimatesToActual(10), { updatedCount: 4 });
  assert.equal(calls.copiedId, 10);
});
