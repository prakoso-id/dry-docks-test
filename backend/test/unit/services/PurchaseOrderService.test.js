import test from 'node:test';
import assert from 'node:assert/strict';
import { PurchaseOrderService } from '../../../src/services/PurchaseOrderService.js';

function createService(overrides = {}) {
  const calls = [];
  const repository = {
    dockExists: async () => true,
    shipyardExists: async () => true,
    findRfqById: async (id) => ({ id, dryDockId: 10 }),
    listForDock: async () => [],
    createForDock: async (dockId, input) => { calls.push(['create', dockId, input]); return { id: 7, dryDockId: dockId, ...input }; },
    findById: async (id) => ({ id, dryDockId: 10, shipyardId: 1, poNo: 'PO-1', currency: 'USD' }),
    update: async (id, changes) => ({ id, ...changes }),
    delete: async () => true,
    ...overrides
  };
  return { service: new PurchaseOrderService({ repository }), calls };
}

test('creates and lists Purchase Orders for the requested dock', async () => {
  const { service, calls } = createService();
  const order = await service.createForDock(10, { shipyardId: 1, poNo: 'PO-1', currency: 'USD' });
  await service.listForDock(10);
  assert.equal(order.dryDockId, 10);
  assert.equal(calls[0][0], 'create');
});

test('rejects duplicate Purchase Order numbers with a conflict', async () => {
  const duplicate = Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
  const { service } = createService({ createForDock: async () => { throw duplicate; } });
  await assert.rejects(service.createForDock(10, { shipyardId: 1, poNo: 'PO-1', currency: 'USD' }), { statusCode: 409, code: 'CONFLICT' });
});

test('rejects a missing supplier or RFQ before writing', async () => {
  const missingSupplier = createService({ shipyardExists: async () => false });
  await assert.rejects(missingSupplier.service.createForDock(10, { shipyardId: 999, poNo: 'PO-1', currency: 'USD' }), { code: 'INVALID_REFERENCE' });
  const missingRfq = createService({ findRfqById: async () => null });
  await assert.rejects(missingRfq.service.createForDock(10, { shipyardId: 1, rfqId: 999, poNo: 'PO-1', currency: 'USD' }), { code: 'INVALID_REFERENCE' });
});

test('deletes a leaf Purchase Order', async () => {
  let removed = 0;
  const { service } = createService({ delete: async () => { removed += 1; return true; } });
  await service.delete(7);
  assert.equal(removed, 1);
});
