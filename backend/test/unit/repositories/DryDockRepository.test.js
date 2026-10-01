import test from 'node:test';
import assert from 'node:assert/strict';
import { DryDockRepository } from '../../../src/repositories/DryDockRepository.js';

test('loads Cost total budgets separately from the Dry Dock budget', async () => {
  const calls = [];
  const pool = { execute: async (sql, values) => {
    calls.push({ sql, values });
    return sql.includes('FROM dry_dock WHERE')
      ? [[{ budget: '200000.00', currency: 'USD' }]]
      : [[{ totalBudget: '400.00', yardEstimate: '300.00' }, { totalBudget: '200.00', yardEstimate: null }]];
  } };

  const input = await new DryDockRepository({ pool }).findCostSummaryInput(10);

  assert.equal(input.budget, '200000.00');
  assert.deepEqual(input.costs.map((cost) => cost.totalBudget), ['400.00', '200.00']);
  assert.match(calls[1].sql, /total_budget AS totalBudget/);
  assert.deepEqual(calls.map((call) => call.values), [[10], [10]]);
});
