import test from 'node:test';
import assert from 'node:assert/strict';
import { RFQ } from '../../../src/models/RFQ.js';

test('requires a dock owner and prevents expiry before request date', () => {
  assert.throws(() => new RFQ({ dryDockId: 0, rfqNo: 'RFQ-1' }).assertValid(), { code: 'VALIDATION_ERROR' });
  assert.throws(() => new RFQ({ dryDockId: 2, rfqNo: 'RFQ-1', requestDate: '2026-02-10', expiryDate: '2026-02-09' }).assertValid(), { code: 'VALIDATION_ERROR' });
});

test('accepts optional source requisition and supply fields', () => {
  const record = new RFQ({
    dryDockId: 2, rfqNo: 'RFQ-1', requisitionType: 'Service', requisitionDate: '2026-02-01',
    requisitionNature: 'Repair', voyageNumber: 'V-4', supplyPort: 'Jakarta', supplyDate: '2026-02-20'
  }).assertValid().toRecord();

  assert.equal(record.supplyPort, 'Jakarta');
});
