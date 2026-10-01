import test from 'node:test';
import assert from 'node:assert/strict';
import { DailyReportService } from '../../../src/services/DailyReportService.js';

function createService(overrides = {}) {
  const calls = [];
  const repository = {
    dockExists: async () => true,
    listForDock: async (id) => { calls.push(['list', id]); return []; },
    createForDock: async (id, input) => { calls.push(['create', id, input]); return { id: 1, dryDockId: id, ...input }; },
    findById: async (id) => ({ id, dryDockId: 10, title: 'Daily status', reportDate: '2026-02-02', reportType: 'Daily' }),
    update: async (id, changes) => { calls.push(['update', id, changes]); return { id, ...changes }; },
    delete: async () => true,
    ...overrides
  };
  return { service: new DailyReportService({ repository }), calls };
}

test('lists reports only for an existing dock', async () => {
  const { service, calls } = createService();
  await service.listForDock(10);
  assert.deepEqual(calls, [['list', 10]]);
});

test('creates a validated report owned by the requested dock', async () => {
  const { service, calls } = createService();
  const report = await service.createForDock(10, { title: 'Daily report', reportDate: '2026-02-02', reportType: 'Daily' });
  assert.equal(report.dryDockId, 10);
  assert.equal(calls[0][0], 'create');
});

test('updates report fields without allowing ownership changes', async () => {
  const { service, calls } = createService();
  await service.update(5, { reportType: 'Completion' });
  assert.deepEqual(calls[0], ['update', 5, { reportType: 'Completion' }]);
});

test('returns not found when deleting an unknown report', async () => {
  const { service } = createService({ delete: async () => false });
  await assert.rejects(service.delete(404), { statusCode: 404, code: 'NOT_FOUND' });
});
