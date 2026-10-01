import test from 'node:test';
import assert from 'node:assert/strict';
import { purchaseOrderCreateSchema } from '../../../src/validators/purchaseOrderSchemas.js';

test('accepts a Purchase Order with optional source detail', () => {
  const result = purchaseOrderCreateSchema.safeParse({
    shipyardId: 1, poNo: 'PO-1', poDate: '2026-02-02', currency: 'USD', totalCost: 10.25,
    totalCostUsd: 10.25, expenseCategory: 'Repair', supplyPort: 'Jakarta', deliveryDate: '2026-02-10'
  });
  assert.equal(result.success, true);
});

test('rejects negative totals, malformed currency, and unknown fields', () => {
  assert.equal(purchaseOrderCreateSchema.safeParse({ shipyardId: 1, poNo: 'PO-1', currency: 'USD', totalCost: -1 }).success, false);
  assert.equal(purchaseOrderCreateSchema.safeParse({ shipyardId: 1, poNo: 'PO-1', currency: 'US' }).success, false);
  assert.equal(purchaseOrderCreateSchema.safeParse({ shipyardId: 1, poNo: 'PO-1', currency: 'USD', opaque: 1 }).success, false);
});

test('rejects impossible delivery dates and totals beyond database precision', () => {
  assert.equal(purchaseOrderCreateSchema.safeParse({ shipyardId: 1, poNo: 'PO-1', currency: 'USD', deliveryDate: '2026-02-30' }).success, false);
  assert.equal(purchaseOrderCreateSchema.safeParse({ shipyardId: 1, poNo: 'PO-1', currency: 'USD', totalCostUsd: 10.125 }).success, false);
});

test('rejects Purchase Order totals beyond DECIMAL(15,2)', () => {
  assert.equal(purchaseOrderCreateSchema.safeParse({ shipyardId: 1, poNo: 'PO-1', currency: 'USD', totalCost: 10_000_000_000_000 }).success, false);
});
