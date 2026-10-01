import test from 'node:test';
import assert from 'node:assert/strict';
import { sumCostAmounts, toCostPayload } from '../src/services/costs.js';

test('calculates Cost sums with exact cents', () => {
  assert.equal(sumCostAmounts('0.10', '0.20'), '0.30');
});

test('maps the source Cost form to API fields and omits generated totals', () => {
  const payload = toCostPayload({ jobName: ' Pump ', yardEstimate: '10.25', ownerEstimate: '2', sortOrder: '3', specificationGroupId: '5' });
  assert.equal(payload.jobName, 'Pump');
  assert.equal(payload.yardEstimate, 10.25);
  assert.equal(payload.sortOrder, 3);
  assert.equal(payload.specificationGroupId, 5);
  assert.equal('totalEstimates' in payload, false);
  assert.equal('variance' in payload, false);
});
