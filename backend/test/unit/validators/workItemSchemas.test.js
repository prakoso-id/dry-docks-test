import test from 'node:test';
import assert from 'node:assert/strict';
import { costCreateSchema, costUpdateSchema, dryDockFactCreateSchema, taskCreateSchema, taskUpdateSchema, workOrderCreateSchema } from '../../../src/validators/workItemSchemas.js';

test('rejects a legacy Work Order field from Task requests', () => {
  const input = { title: 'Inspect pump', dueDate: '2026-11-02', workOrderId: 12 };

  assert.equal(taskCreateSchema.safeParse(input).success, false);
  assert.equal(taskUpdateSchema.safeParse({ workOrderId: 12 }).success, false);
});

test('accepts internal estimate and current actual costs on a Work Order', () => {
  const result = workOrderCreateSchema.safeParse({
    specificationGroupId: 1, jobName: 'Pump overhaul', description: 'Inspect pump', currency: 'USD',
    internalEstimate: 12.34, actualYardCost: 4, actualOwnerCost: 3
  });

  assert.equal(result.success, true);
});

test('accepts source Work Order fields and rejects client-supplied derived estimates', () => {
  const result = workOrderCreateSchema.safeParse({
    specificationGroupId: 1, jobName: 'Pump overhaul', description: 'Inspect pump', currency: 'USD',
    accountCodes: 'ABC-123', yardEstimate: 10, ownerEstimate: 5
  });

  assert.equal(result.success, true);
  assert.equal(workOrderCreateSchema.safeParse({
    specificationGroupId: 1, jobName: 'Pump overhaul', description: 'Inspect pump', currency: 'USD', totalEstimates: 15
  }).success, false);
});

test('validates source Cost fields and rejects unsupported values', () => {
  const base = { jobName: 'Pump overhaul', jobDescription: 'Inspect pump' };
  assert.equal(costCreateSchema.safeParse({ ...base, yardEstimate: 10, ownerEstimate: 5 }).success, true);
  assert.equal(costCreateSchema.safeParse({ ...base, actualYardCost: -1 }).success, false);
  assert.equal(costUpdateSchema.safeParse({}).success, false);
});

test('rejects impossible work dates and amounts with more than two decimals', () => {
  assert.equal(taskCreateSchema.safeParse({ title: 'Inspect pump', dueDate: '2026-02-30' }).success, false);
  assert.equal(dryDockFactCreateSchema.safeParse({ activity: 'Arrival', factDate: '2026-02-30' }).success, false);
  assert.equal(workOrderCreateSchema.safeParse({
    specificationGroupId: 1, jobName: 'Pump overhaul', description: 'Inspect pump', currency: 'USD', yardEstimate: 1.234
  }).success, false);
  assert.equal(workOrderCreateSchema.safeParse({
    specificationGroupId: 1, jobName: 'Pump overhaul', description: 'Inspect pump', currency: 'USD', estimatedHours: 1.234
  }).success, false);
});

test('rejects Work Order amounts, hours, and last-done values beyond column ranges', () => {
  const base = { specificationGroupId: 1, jobName: 'Pump overhaul', description: 'Inspect pump', currency: 'USD' };
  assert.equal(workOrderCreateSchema.safeParse({ ...base, yardEstimate: 10_000_000_000_000 }).success, false);
  assert.equal(workOrderCreateSchema.safeParse({ ...base, estimatedHours: 100_000_000 }).success, false);
  assert.equal(workOrderCreateSchema.safeParse({ ...base, lastDoneValue: 10_000_000_000 }).success, false);
});
