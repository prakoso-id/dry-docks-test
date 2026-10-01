import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkOrder } from '../../../src/models/WorkOrder.js';

test('rejects negative internal estimates and actual costs', () => {
  for (const field of ['internalEstimate', 'actualYardCost', 'actualOwnerCost']) {
    assert.throws(
      () => new WorkOrder({ currency: 'USD', [field]: -0.01 }).assertValid(),
      { code: 'VALIDATION_ERROR' }
    );
  }
});
