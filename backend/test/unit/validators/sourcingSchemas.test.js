import test from 'node:test';
import assert from 'node:assert/strict';
import { quotationCreateSchema, rfqCreateSchema } from '../../../src/validators/sourcingSchemas.js';

test('accepts the chosen RFQ source fields', () => {
  assert.equal(rfqCreateSchema.safeParse({
    rfqNo: 'RFQ-1', requestDate: '2026-02-01', expiryDate: '2026-02-10', requisitionType: 'Service',
    requisitionDate: '2026-01-30', requisitionNature: 'Repair', voyageNumber: 'V-4', supplyPort: 'Jakarta', supplyDate: '2026-02-20'
  }).success, true);
});

test('rejects reversed RFQ dates and unknown source fields', () => {
  assert.equal(rfqCreateSchema.safeParse({ rfqNo: 'RFQ-1', requestDate: '2026-02-10', expiryDate: '2026-02-01' }).success, false);
  assert.equal(rfqCreateSchema.safeParse({ rfqNo: 'RFQ-1', unsupported: true }).success, false);
});

test('rejects impossible RFQ dates and quotation totals beyond database precision', () => {
  assert.equal(rfqCreateSchema.safeParse({ rfqNo: 'RFQ-1', requestDate: '2026-02-30' }).success, false);
  assert.equal(quotationCreateSchema.safeParse({ currency: 'USD', totalCost: 10.125 }).success, false);
});
