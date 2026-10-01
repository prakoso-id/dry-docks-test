import test from 'node:test';
import assert from 'node:assert/strict';
import { PurchaseOrder } from '../../../src/models/PurchaseOrder.js';

test('requires a dock, supplier, purchase order number, and currency', () => {
  assert.throws(() => new PurchaseOrder({ shipyardId: 1, poNo: 'PO-1', currency: 'USD' }).assertValid(), { code: 'VALIDATION_ERROR' });
  assert.throws(() => new PurchaseOrder({ dryDockId: 1, shipyardId: 0, poNo: 'PO-1', currency: 'USD' }).assertValid(), { code: 'VALIDATION_ERROR' });
  assert.throws(() => new PurchaseOrder({ dryDockId: 1, shipyardId: 1, poNo: 'PO-1', currency: 'US' }).assertValid(), { code: 'VALIDATION_ERROR' });
});

test('rejects negative totals and accepts optional order detail', () => {
  assert.throws(() => new PurchaseOrder({ dryDockId: 1, shipyardId: 1, poNo: 'PO-1', currency: 'USD', totalCost: -1 }).assertValid(), { code: 'VALIDATION_ERROR' });
  assert.equal(new PurchaseOrder({ dryDockId: 1, shipyardId: 1, poNo: 'PO-1', currency: 'USD', expenseCategory: 'Repairs', supplyPort: 'Jakarta' }).assertValid().toRecord().supplyPort, 'Jakarta');
});
