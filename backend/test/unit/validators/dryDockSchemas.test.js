import test from 'node:test';
import assert from 'node:assert/strict';
import { createDryDockSchema } from '../../../src/validators/dryDockSchemas.js';

test('rejects impossible Dry Dock dates and budgets with excess precision', () => {
  const base = { vesselId: 1, dockNo: 'DD-1', description: 'Dock', currency: 'USD' };
  assert.equal(createDryDockSchema.safeParse({ ...base, plannedStart: '2026-02-30' }).success, false);
  assert.equal(createDryDockSchema.safeParse({ ...base, budget: 12.345 }).success, false);
});

test('rejects budgets beyond DECIMAL(15,2)', () => {
  assert.equal(createDryDockSchema.safeParse({ vesselId: 1, dockNo: 'DD-1', description: 'Dock', currency: 'USD', budget: 10_000_000_000_000 }).success, false);
});
