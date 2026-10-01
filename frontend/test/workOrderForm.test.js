import test from 'node:test';
import assert from 'node:assert/strict';
import { toWorkOrderPayload } from '../src/services/workOrderForm.js';

test('builds a normalized Work Order payload with source fields and derived currency', () => {
  const payload = toWorkOrderPayload({
    specificationGroupId: '8', jobName: '  Pump overhaul  ', title: '  Inspect  ', description: 'Fix',
    standardJob: true, criticalJob: false, internalJob: true, lastDoneDate: '2025-02-03', lastDoneValue: '4.2',
    inspectionTypes: 'Visual', machineryGroup: '', machinery: '', jobCode: '', jobCategory: '', jobType: '', accountCodes: '',
    estimatedHours: '', responsibleRank: '', priority: '', status: '', totalBudget: '', sortOrder: '2', yardEstimate: '45.67', ownerEstimate: '3'
  }, 'USD');

  assert.deepEqual({
    specificationGroupId: payload.specificationGroupId,
    jobName: payload.jobName,
    title: payload.title,
    standardJob: payload.standardJob,
    criticalJob: payload.criticalJob,
    internalJob: payload.internalJob,
    lastDoneDate: payload.lastDoneDate,
    lastDoneValue: payload.lastDoneValue,
    accountCodes: payload.accountCodes,
    yardEstimate: payload.yardEstimate,
    ownerEstimate: payload.ownerEstimate,
    sortOrder: payload.sortOrder,
    inspectionTypes: payload.inspectionTypes,
    currency: payload.currency
  }, {
    specificationGroupId: 8, jobName: 'Pump overhaul', title: 'Inspect', standardJob: true,
    criticalJob: false, internalJob: true, lastDoneDate: '2025-02-03', lastDoneValue: 4.2,
    accountCodes: null, yardEstimate: 45.67, ownerEstimate: 3,
    sortOrder: 2, inspectionTypes: 'Visual', currency: 'USD'
  });
});

test('includes the pasted Work Order Master fields without inventing Work Order-only inputs', () => {
  const payload = toWorkOrderPayload({
    specificationGroupId: '8', jobName: 'Pump overhaul', description: 'Inspect pump',
    accountCodes: 'ABC-123', sortOrder: '4', budget: '20', itemBudget: '5',
    totalBudget: '25', yardEstimate: '10', ownerEstimate: '5',
    standardJob: true, criticalJob: false, internalJob: true
  }, 'USD');

  assert.equal(payload.accountCodes, 'ABC-123');
  assert.equal(payload.sortOrder, 4);
  assert.equal(payload.yardEstimate, 10);
  assert.equal(payload.ownerEstimate, 5);
  assert.equal(payload.totalBudget, 25);
  assert.equal('budget' in payload, false);
  assert.equal('itemBudget' in payload, false);
});
