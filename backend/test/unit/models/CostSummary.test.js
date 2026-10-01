import test from 'node:test';
import assert from 'node:assert/strict';
import { CostSummary } from '../../../src/models/CostSummary.js';

test('sums estimate and actual cost components', () => {
  const summary = CostSummary.from({
    budget: '500.00', currency: 'USD', costs: [
      { currency: 'USD', yardEstimate: '100.25', ownerEstimate: '20.00', actualYardCost: '90.00', actualOwnerCost: '30.00' },
      { currency: 'USD', yardEstimate: '10.00', ownerEstimate: '5.75', actualYardCost: '15.00', actualOwnerCost: '0.00' }
    ]
  });

  assert.deepEqual(summary, {
    budget: '500.00', costBudget: '0.00', currency: 'USD', yardEstimates: '110.25', ownerEstimates: '25.75',
    totalEstimates: '136.00', actualYardCosts: '105.00', actualOwnerCosts: '30.00',
    totalCosts: '135.00', variance: '-1.00'
  });
});

test('treats nullable costs as zero', () => {
  const summary = CostSummary.from({
    budget: null, currency: 'USD', costs: [{ currency: 'USD', yardEstimate: null, ownerEstimate: '4.25', actualYardCost: null, actualOwnerCost: null }]
  });

  assert.equal(summary.budget, '0.00');
  assert.equal(summary.costBudget, '0.00');
  assert.equal(summary.yardEstimates, '0.00');
  assert.equal(summary.ownerEstimates, '4.25');
  assert.equal(summary.totalCosts, '0.00');
});

test('sums exact cents without floating-point error', () => {
  const summary = CostSummary.from({
    budget: 0, currency: 'USD', costs: [
      { currency: 'USD', yardEstimate: '0.10', ownerEstimate: '0.20' }
    ]
  });

  assert.equal(summary.totalEstimates, '0.30');
});

test('summarizes Cost records so newly added Costs affect the dock summary', () => {
  const summary = CostSummary.from({
    budget: '200000.00', currency: 'USD', costs: [
      { currency: 'USD', budget: '300.00', itemBudget: '100.00', totalBudget: '400.00', yardEstimate: '100.00', ownerEstimate: '25.00', actualYardCost: '80.00', actualOwnerCost: '10.00' },
      { currency: 'USD', budget: '150.00', itemBudget: '50.00', totalBudget: '200.00', yardEstimate: '20.00', ownerEstimate: '5.00', actualYardCost: '30.00', actualOwnerCost: '15.00' }
    ]
  });

  assert.equal(summary.budget, '200000.00');
  assert.equal(summary.costBudget, '600.00');
  assert.equal(summary.totalEstimates, '150.00');
  assert.equal(summary.totalCosts, '135.00');
  assert.equal(summary.variance, '-15.00');
});

test('returns zero totals when the dock has no Work Orders', () => {
  const summary = CostSummary.from({ budget: '250.00', currency: 'USD', costs: [] });

  assert.equal(summary.budget, '250.00');
  assert.equal(summary.costBudget, '0.00');
  assert.equal(summary.totalEstimates, '0.00');
  assert.equal(summary.totalCosts, '0.00');
  assert.equal(summary.variance, '0.00');
});

test('calculates positive over-estimate and negative under-estimate variance', () => {
  const over = CostSummary.from({
    budget: 0, currency: 'USD', costs: [{ currency: 'USD', yardEstimate: '1.00', actualYardCost: '2.00' }]
  });
  const under = CostSummary.from({
    budget: 0, currency: 'USD', costs: [{ currency: 'USD', yardEstimate: '2.00', actualYardCost: '1.00' }]
  });

  assert.equal(over.variance, '1.00');
  assert.equal(under.variance, '-1.00');
});

test('rejects Work Orders whose currency differs from the dock', () => {
  assert.throws(
    () => CostSummary.from({ currency: 'USD', costs: [{ currency: 'EUR', yardEstimate: '1.00' }] }),
    { code: 'VALIDATION_ERROR' }
  );
});
