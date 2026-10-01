import test from 'node:test';
import assert from 'node:assert/strict';
import { DryDockService } from '../../../src/services/DryDockService.js';

function createService(repositoryOverrides = {}) {
  const calls = {};
  const repository = {
    list: async (filters) => { calls.filters = filters; return { items: [], total: 0 }; },
    findById: async () => null,
    create: async (record) => ({ id: 1, ...record }),
    update: async () => null,
    ...repositoryOverrides
  };
  return { service: new DryDockService({ repository }), calls };
}

test('caps list page size and passes normalized filters to repository', async () => {
  const { service, calls } = createService();

  const result = await service.list({ page: '3', limit: '999', status: 'Execution', vesselId: '7' });

  assert.deepEqual(calls.filters, {
    status: 'Execution',
    vesselId: 7,
    page: 3,
    limit: 100,
    offset: 200
  });
  assert.equal(result.page, 3);
  assert.equal(result.limit, 100);
});

test('rejects an end date before its start without writing', async () => {
  let writes = 0;
  const { service } = createService({ create: async () => { writes += 1; } });

  await assert.rejects(
    service.create({ vesselId: 1, dockNo: 'DD-1', description: 'Annual docking', currency: 'USD', plannedStart: '2026-10-12', plannedEnd: '2026-10-11' }),
    { code: 'VALIDATION_ERROR' }
  );
  assert.equal(writes, 0);
});

test('maps duplicate vessel and dock number to HTTP conflict', async () => {
  const duplicate = Object.assign(new Error('duplicate key'), { code: 'ER_DUP_ENTRY' });
  const { service } = createService({ create: async () => { throw duplicate; } });

  await assert.rejects(
    service.create({ vesselId: 1, dockNo: 'DD-1', description: 'Annual docking', currency: 'USD' }),
    { statusCode: 409, code: 'CONFLICT' }
  );
});

test('returns not found when a dock id does not exist', async () => {
  const { service } = createService();

  await assert.rejects(service.getById(404), { statusCode: 404, code: 'NOT_FOUND' });
});

test('returns a dock cost summary from persisted Work Order values', async () => {
  const { service } = createService({
    findById: async () => ({ id: 10 }),
    findCostSummaryInput: async (id) => id === 10 ? {
      budget: '500.00', currency: 'USD', costs: [
        { currency: 'USD', totalBudget: '75.00', yardEstimate: '100.00', ownerEstimate: '20.00', actualYardCost: '80.00', actualOwnerCost: '50.00' }
      ]
    } : null
  });

  assert.deepEqual(await service.getCostSummary(10), {
    budget: '500.00', costBudget: '75.00', currency: 'USD', yardEstimates: '100.00', ownerEstimates: '20.00',
    totalEstimates: '120.00', actualYardCosts: '80.00', actualOwnerCosts: '50.00',
    totalCosts: '130.00', variance: '10.00'
  });
});

test('returns 404 for a missing cost summary dock without querying Work Orders', async () => {
  let queries = 0;
  const { service } = createService({ findCostSummaryInput: async () => { queries += 1; return null; } });

  await assert.rejects(service.getCostSummary(404), { statusCode: 404, code: 'NOT_FOUND' });
  assert.equal(queries, 0);
});

test('deletes an existing dry dock', async () => {
  let deletedId;
  const { service } = createService({ delete: async (id) => { deletedId = id; return true; } });

  await service.delete(7);

  assert.equal(deletedId, 7);
});

test('returns not found when deleting a missing dry dock', async () => {
  const { service } = createService({ delete: async () => false });

  await assert.rejects(service.delete(404), { statusCode: 404, code: 'NOT_FOUND' });
});

test('returns conflict when a dry dock still has related records', async () => {
  const referenced = Object.assign(new Error('referenced row'), { code: 'ER_ROW_IS_REFERENCED_2' });
  const { service } = createService({ delete: async () => { throw referenced; } });

  await assert.rejects(service.delete(7), { statusCode: 409, code: 'CONFLICT' });
});
