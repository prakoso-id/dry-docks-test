import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCostComparisonGroups, buildWorkOrderStatusSegments, formatCostSummary, getCostSummary } from '../src/services/costSummary.js';

const emptySummary = {
  budget: '0.00', currency: 'USD', yardEstimates: '0.00', ownerEstimates: '0.00', totalEstimates: '0.00',
  actualYardCosts: '0.00', actualOwnerCosts: '0.00', totalCosts: '0.00', variance: '0.00'
};

test('formats zero totals and preserves the dock currency', () => {
  const result = formatCostSummary(emptySummary, 'en-US');

  assert.equal(result.currency, 'USD');
  assert.equal(result.budget, '$0.00');
  assert.equal(result.totalCosts, '$0.00');
});

test('formats a negative variance as an under-estimate amount', () => {
  const result = formatCostSummary({ ...emptySummary, variance: '-1.25' }, 'en-US');

  assert.equal(result.variance, '-$1.25');
});

test('loads the summary from the dock-scoped endpoint', async () => {
  const originalFetch = globalThis.fetch;
  let url;
  globalThis.fetch = async (requestUrl) => {
    url = requestUrl;
    return new Response(JSON.stringify({ data: emptySummary }), { status: 200 });
  };

  try {
    assert.deepEqual(await getCostSummary(12), emptySummary);
    assert.equal(url, '/api/v1/dry-docks/12/cost-summary');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('builds pie chart slices from work order statuses', () => {
  assert.deepEqual(buildWorkOrderStatusSegments([
    { status: 'Open' }, { status: 'Open' }, { status: 'In Progress' }, { status: '' }
  ]), [
    { label: 'Open', count: 2 },
    { label: 'In Progress', count: 1 },
    { label: 'Unspecified', count: 1 }
  ]);
});

test('groups comparison chart amounts by specification group', () => {
  assert.deepEqual(buildCostComparisonGroups([
    { specificationGroupName: 'Hull', totalBudget: '100.00', totalEstimates: '80.00', totalCosts: '60.00' },
    { specificationGroupName: 'Hull', totalBudget: '50.00', totalEstimates: '20.00', totalCosts: '30.00' },
    { specificationGroupName: null, totalBudget: '25.00', totalEstimates: '10.00', totalCosts: '5.00' }
  ]), [
    { label: 'Hull', totalBudget: 150, totalEstimates: 100, totalCosts: 90 },
    { label: 'Unassigned', totalBudget: 25, totalEstimates: 10, totalCosts: 5 }
  ]);
});
