import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkOrderService } from '../../../src/services/WorkOrderService.js';

test('rejects a specification group belonging to another vessel', async () => {
  const repository = {
    findDockReference: async () => ({ vesselId: 1, currency: 'USD' }),
    findSpecificationGroupVesselId: async () => 2,
    createForDock: async () => { throw new Error('must not write'); }
  };
  const service = new WorkOrderService({ repository });

  await assert.rejects(
    service.createForDock(10, { jobName: 'Pump overhaul', specificationGroupId: 5, description: 'Inspect pump', currency: 'USD' }),
    { statusCode: 422, code: 'INVALID_REFERENCE' }
  );
});

test('rejects negative estimated hours before writing', async () => {
  const repository = {
    findDockReference: async () => ({ vesselId: 1, currency: 'USD' }),
    findSpecificationGroupVesselId: async () => 1,
    createForDock: async () => { throw new Error('must not write'); }
  };
  const service = new WorkOrderService({ repository });

  await assert.rejects(
    service.createForDock(10, { jobName: 'Pump overhaul', specificationGroupId: 5, description: 'Inspect pump', currency: 'USD', estimatedHours: -1 }),
    { code: 'VALIDATION_ERROR' }
  );
});

test('rejects a Work Order currency that differs from its dock', async () => {
  let writes = 0;
  const repository = {
    findDockReference: async () => ({ vesselId: 1, currency: 'USD' }),
    findSpecificationGroupVesselId: async () => 1,
    createForDock: async () => { writes += 1; }
  };

  await assert.rejects(
    new WorkOrderService({ repository }).createForDock(10, {
      specificationGroupId: 5, jobName: 'Pump overhaul', description: 'Inspect pump', currency: 'EUR'
    }),
    { code: 'VALIDATION_ERROR' }
  );
  assert.equal(writes, 0);
});

test('accepts new estimate and actual fields in the dock currency', async () => {
  let created;
  const repository = {
    findDockReference: async () => ({ vesselId: 1, currency: 'USD' }),
    findSpecificationGroupVesselId: async () => 1,
    createForDock: async (_dockId, input) => { created = input; return input; }
  };

  await new WorkOrderService({ repository }).createForDock(10, {
    specificationGroupId: 5, jobName: 'Pump overhaul', description: 'Inspect pump', currency: 'USD',
    internalEstimate: 12.34, actualYardCost: 2.5, actualOwnerCost: 1
  });

  assert.deepEqual(
    { internalEstimate: created.internalEstimate, actualYardCost: created.actualYardCost, actualOwnerCost: created.actualOwnerCost },
    { internalEstimate: 12.34, actualYardCost: 2.5, actualOwnerCost: 1 }
  );
});

test('removes a stored Work Order image if its metadata cannot be saved', async () => {
  let removed = 0;
  const repository = {
    findById: async () => ({ id: 8 }),
    addAttachment: async () => { throw new Error('metadata insert failed'); }
  };
  const imageStorage = {
    save: async () => ({ fileName: 'photo.png', storageKey: 'random.png' }),
    remove: async () => { removed++; }
  };

  await assert.rejects(
    new WorkOrderService({ repository, imageStorage }).addImage(8, {
      buffer: Buffer.from('png'), mimeType: 'image/png', fileName: 'photo.png'
    }),
    /metadata insert failed/
  );
  assert.equal(removed, 1);
});
