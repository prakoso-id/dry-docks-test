import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkOrderRepository } from '../../../src/repositories/WorkOrderRepository.js';

function transactionalPool({ failUpdate = false } = {}) {
  const calls = [];
  const connection = {
    async beginTransaction() { calls.push(['begin']); },
    async execute(sql, values) {
      calls.push(['execute', sql, values]);
      if (failUpdate && sql.startsWith('UPDATE work_order SET')) throw new Error('update failed');
      if (sql.startsWith('INSERT INTO work_order_update')) return [{ insertId: 41 }];
      if (sql.includes('FROM work_order_update WHERE id')) return [[{ id: 41, workOrderId: 7 }]];
      return [{ affectedRows: 1 }];
    },
    async commit() { calls.push(['commit']); },
    async rollback() { calls.push(['rollback']); },
    release() { calls.push(['release']); }
  };
  return { calls, pool: { getConnection: async () => connection } };
}

test('records an update and changes only the supplied actual cost', async () => {
  const { calls, pool } = transactionalPool();
  const update = await new WorkOrderRepository({ pool }).addUpdate(7, { actualYardCost: 82.4, description: 'Invoiced' });
  const write = calls.find(([, sql]) => sql?.startsWith('UPDATE work_order SET'));

  assert.equal(update.id, 41);
  assert.match(write[1], /actual_yard_cost = \?/);
  assert.doesNotMatch(write[1], /actual_owner_cost/);
  assert.deepEqual(write[2], [82.4, 7]);
  assert.ok(calls.some(([name]) => name === 'commit'));
});

test('rolls back history when updating current actual cost fails', async () => {
  const { calls, pool } = transactionalPool({ failUpdate: true });

  await assert.rejects(
    new WorkOrderRepository({ pool }).addUpdate(7, { actualYardCost: 82.4 }),
    /update failed/
  );
  assert.ok(calls.some(([name]) => name === 'rollback'));
  assert.ok(!calls.some(([name]) => name === 'commit'));
  assert.ok(calls.some(([name]) => name === 'release'));
});
